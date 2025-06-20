"""
Utilidades para generación de PDFs y otras funciones comunes.
"""
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.units import cm, mm
from io import BytesIO
import os
from decimal import Decimal


class PDFGenerator:
    """Clase para generar PDFs de facturas."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = self.styles['Heading1']
        self.subtitle_style = self.styles['Heading2']
        self.normal_style = self.styles['Normal']
    
    def generar_factura_pdf(self, factura):
        """
        Generar un PDF para la factura especificada.
        
        Args:
            factura: Instancia del modelo Factura
            
        Returns:
            HttpResponse con el PDF generado
        """
        try:
            # 1. Determinar cliente según origen
            cliente = self._obtener_cliente_factura(factura)
            if not cliente:
                raise ValueError('Factura sin origen válido')

            # 2. Preparar buffer y documento
            buffer = BytesIO()
            doc = SimpleDocTemplate(
                buffer, pagesize=A4,
                rightMargin=72, leftMargin=72,
                topMargin=72, bottomMargin=72
            )
            elements = []

            # 3. Título y fecha
            elements.append(Paragraph(f"FACTURA #{factura.id}", self.title_style))
            elements.append(Spacer(1, 12))
            fecha = factura.fecha.strftime("%d/%m/%Y") if factura.fecha else "Sin fecha"
            elements.append(Paragraph(f"Fecha: {fecha}", self.normal_style))
            elements.append(Spacer(1, 12))

            # 4. Datos del cliente
            elements.extend(self._generar_seccion_cliente(cliente))

            # 5. Obtener y procesar items
            items = self._obtener_items_factura(factura)
            
            # 6. Tabla de ítems y totales
            elements.extend(self._generar_tabla_items(items, doc))

            # 7. Notas finales
            elements.append(Paragraph("Gracias por confiar en nosotros.", self.normal_style))

            # 8. Construir PDF
            doc.build(elements)

            # 9. Devolver respuesta
            pdf_bytes = buffer.getvalue()
            buffer.close()

            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="Factura_{factura.id}.pdf"'
            return response

        except Exception as e:
            raise Exception(f"Error generando PDF: {str(e)}")
    
    def _obtener_cliente_factura(self, factura):
        """Obtener el cliente de la factura según su origen."""
        if factura.pedido:
            return factura.pedido.cliente
        elif factura.albaran:
            return factura.albaran.cliente
        elif factura.ticket:
            return factura.ticket.cliente
        return None
    
    def _obtener_items_factura(self, factura):
        """Obtener los items de la factura según su origen."""
        if factura.pedido:
            return factura.pedido.items.all()
        elif factura.albaran:
            return factura.albaran.items.all()
        elif factura.ticket:
            return factura.ticket.items.all()
        return []
    
    def _generar_seccion_cliente(self, cliente):
        """Generar la sección de datos del cliente."""
        elements = []
        elements.append(Paragraph("Datos del Cliente:", self.subtitle_style))
        elements.append(Paragraph(f"Cliente: {cliente.nombre}", self.normal_style))
        elements.append(Paragraph(f"Dirección: {cliente.direccion or 'N/A'}", self.normal_style))
        elements.append(Paragraph(f"Teléfono: {cliente.telefono or 'N/A'}", self.normal_style))
        elements.append(Paragraph(f"Email: {cliente.email or 'N/A'}", self.normal_style))
        elements.append(Spacer(1, 24))
        return elements
    
    def _generar_tabla_items(self, items, doc):
        """Generar la tabla de items y totales."""
        elements = []
        
        # Encabezado de la tabla
        elements.append(Paragraph("Detalle de Productos:", self.subtitle_style))
        data = [['Concepto', 'Cantidad', 'Precio Unitario', 'IVA (%)', 'Descuento (%)', 'Subtotal']]
        
        subtotal_general = Decimal('0')
        iva_general = Decimal('0')

        # Procesar cada item
        for item in items:
            precio = Decimal(item.precio_unitario)
            iva_pct = Decimal(item.iva)
            descuento_pct = Decimal(getattr(item, 'descuento', 0))
            cantidad = item.cantidad

            precio_desc = precio * (Decimal('1') - descuento_pct / Decimal('100'))
            subtotal_linea = precio_desc * cantidad
            iva_linea = subtotal_linea * (iva_pct / Decimal('100'))

            subtotal_general += subtotal_linea
            iva_general += iva_linea

            data.append([
                item.articulo.nombre,
                str(cantidad),
                f"{precio:.2f} €",
                f"{iva_pct} %",
                f"{descuento_pct} %",
                f"{subtotal_linea:.2f} €"
            ])

        # Configurar tabla
        col_widths = [
            doc.width * 0.3, doc.width * 0.1,
            doc.width * 0.15, doc.width * 0.15,
            doc.width * 0.15, doc.width * 0.15
        ]

        table = Table(data, colWidths=col_widths)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 12))

        # Tabla de totales
        total_general = subtotal_general + iva_general
        totals_data = [
            ['Subtotal', f"{subtotal_general:.2f} €"],
            ['IVA', f"{iva_general:.2f} €"],
            ['TOTAL', f"{total_general:.2f} €"],
        ]
        
        totals_table = Table(totals_data, colWidths=[doc.width*0.5, doc.width*0.5], hAlign='RIGHT')
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 2), (-1, 2), 'Helvetica-Bold'),
            ('LINEBELOW', (0, 0), (-1, 1), 1, colors.grey),
            ('LINEBELOW', (0, 2), (-1, 2), 1.5, colors.black),
        ]))
        elements.append(totals_table)
        elements.append(Spacer(1, 36))
        
        return elements
