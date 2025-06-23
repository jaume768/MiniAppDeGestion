from io import BytesIO
from decimal import Decimal
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors


class PDFDocumentGenerator:
    """
    Generador modular de PDFs para documentos de venta.
    Funciona con Factura, Presupuesto, Pedido, Albaran, Ticket.
    """
    
    def __init__(self, documento):
        self.documento = documento
        self.tipo_documento = self._get_document_type()
    
    def _get_document_type(self):
        """Detecta automáticamente el tipo de documento"""
        model_name = self.documento.__class__.__name__.lower()
        tipos = {
            'factura': 'FACTURA',
            'presupuesto': 'PRESUPUESTO', 
            'pedido': 'PEDIDO',
            'albaran': 'ALBARÁN',
            'ticket': 'TICKET'
        }
        return tipos.get(model_name, 'DOCUMENTO')
    
    def _build_elements(self):
        """Construye todos los elementos del PDF"""
        styles = getSampleStyleSheet()
        title = styles['Heading1']
        normal = styles['Normal']
        subtitle = styles['Heading2']
        
        # Encabezado del documento
        elems = [
            Paragraph(f"{self.tipo_documento} #{self.documento.numero}", title),
            Spacer(1, 12),
            Paragraph(f"Fecha: {self.documento.fecha.strftime('%d/%m/%Y')}", normal),
            Spacer(1, 12),
        ]
        
        # Datos del cliente
        elems.extend([
            Paragraph("Datos del Cliente:", subtitle),
            Paragraph(f"Nombre: {self.documento.cliente.nombre} {self.documento.cliente.apellido}", normal),
            Paragraph(f"Email: {self.documento.cliente.email}", normal),
            Paragraph(f"Teléfono: {self.documento.cliente.telefono}", normal),
            Paragraph(f"Dirección: {self.documento.cliente.direccion}", normal),
            Paragraph(f"{self.documento.cliente.ciudad}, {self.documento.cliente.codigo_postal} - {self.documento.cliente.pais}", normal),
            Spacer(1, 24),
        ])
        
        # Tabla de productos
        elems.extend([
            Paragraph("Detalle de Productos:", subtitle),
            Spacer(1, 12),
        ])
        
        # Encabezados de tabla
        data = [['Concepto', 'Cant.', 'Precio Unit.', 'IVA %', 'Subtotal', 'Total']]
        
        # Obtener items del documento
        items = self._get_items()
        
        subtotal_total = Decimal('0')
        iva_total = Decimal('0')
        
        # Procesar cada item
        for item in items:
            precio = Decimal(str(item.precio_unitario))
            cantidad = item.cantidad
            iva_pct = Decimal(str(item.iva))
            
            # Cálculos
            subtotal_item = precio * cantidad
            iva_item = subtotal_item * iva_pct / 100
            total_item = subtotal_item + iva_item
            
            subtotal_total += subtotal_item
            iva_total += iva_item
            
            # Fila de la tabla
            data.append([
                item.articulo.nombre,
                str(cantidad),
                f"{precio:.2f} €",
                f"{iva_pct:.1f}%",
                f"{subtotal_item:.2f} €",
                f"{total_item:.2f} €"
            ])
        
        # Crear tabla de productos
        table = Table(data, colWidths=[A4[0]/6] * 6)
        table.setStyle(TableStyle([
            # Encabezado
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # Contenido
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            
            # Alineaciones específicas
            ('ALIGN', (1, 1), (1, -1), 'CENTER'),  # Cantidad
            ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),  # Precios
        ]))
        
        elems.append(table)
        elems.append(Spacer(1, 20))
        
        # Desglose por IVA (cumplimiento fiscal)
        elems.extend(self._create_iva_breakdown(items))
        
        # Totales finales
        total_final = subtotal_total + iva_total
        
        totals_data = [
            ['Subtotal:', f"{subtotal_total:.2f} €"],
            ['IVA Total:', f"{iva_total:.2f} €"],
            ['TOTAL:', f"{total_final:.2f} €"],
        ]
        
        totals_table = Table(totals_data, colWidths=[A4[0]/3, A4[0]/4], hAlign='RIGHT')
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 1), 'Helvetica'),
            ('FONTNAME', (0, 2), (-1, 2), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 2), (-1, 2), 12),
            ('TEXTCOLOR', (0, 2), (-1, 2), colors.red),
            ('TOPPADDING', (0, 2), (-1, 2), 8),
        ]))
        
        elems.append(totals_table)
        elems.append(Spacer(1, 36))
        
        # Pie de página
        elems.append(Paragraph("Gracias por confiar en nosotros.", normal))
        
        # Nota específica según tipo de documento
        if self.tipo_documento == 'PRESUPUESTO':
            elems.append(Spacer(1, 12))
            elems.append(Paragraph("Este presupuesto tiene validez de 30 días.", styles['Italic']))
        elif self.tipo_documento == 'PEDIDO':
            elems.append(Spacer(1, 12))
            elems.append(Paragraph("Pedido pendiente de entrega.", styles['Italic']))
        elif self.tipo_documento == 'ALBARÁN':
            elems.append(Spacer(1, 12))
            elems.append(Paragraph("Mercancía entregada conforme.", styles['Italic']))
        
        return elems
    
    def _get_items(self):
        """Obtiene los items del documento de forma genérica"""
        if hasattr(self.documento, 'items'):
            return self.documento.items.all()
        else:
            # Fallback para diferentes estructuras
            model_name = self.documento.__class__.__name__.lower()
            items_attr = f"{model_name}item_set"
            if hasattr(self.documento, items_attr):
                return getattr(self.documento, items_attr).all()
        return []
    
    def _create_iva_breakdown(self, items):
        """Crea desglose por tipos de IVA para cumplimiento fiscal"""
        elems = []
        
        # Agrupar por tipo de IVA
        iva_groups = {}
        for item in items:
            iva_rate = float(item.iva)
            if iva_rate not in iva_groups:
                iva_groups[iva_rate] = {
                    'subtotal': Decimal('0'),
                    'cuota_iva': Decimal('0'),
                    'total': Decimal('0')
                }
            
            subtotal_item = Decimal(str(item.precio_unitario)) * item.cantidad
            cuota_iva = subtotal_item * Decimal(str(item.iva)) / 100
            total_item = subtotal_item + cuota_iva
            
            iva_groups[iva_rate]['subtotal'] += subtotal_item
            iva_groups[iva_rate]['cuota_iva'] += cuota_iva
            iva_groups[iva_rate]['total'] += total_item
        
        if len(iva_groups) > 1:  # Solo mostrar si hay múltiples tipos de IVA
            styles = getSampleStyleSheet()
            elems.append(Spacer(1, 20))
            elems.append(Paragraph("Desglose por Tipo de IVA:", styles['Heading3']))
            elems.append(Spacer(1, 12))
            
            # Crear tabla de desglose
            breakdown_data = [['Base Imponible', '% IVA', 'Cuota IVA', 'Total']]
            
            for iva_rate, values in sorted(iva_groups.items()):
                breakdown_data.append([
                    f"{values['subtotal']:.2f} €",
                    f"{iva_rate:.1f}%",
                    f"{values['cuota_iva']:.2f} €",
                    f"{values['total']:.2f} €"
                ])
            
            breakdown_table = Table(breakdown_data, colWidths=[A4[0]/5] * 4, hAlign='RIGHT')
            breakdown_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ALIGN', (0, 1), (-1, -1), 'RIGHT'),
            ]))
            
            elems.append(breakdown_table)
        
        return elems
    
    def get_response(self, filename=None):
        """Genera la respuesta HTTP con el PDF"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        doc.build(self._build_elements())
        
        pdf = buffer.getvalue()
        buffer.close()
        
        response = HttpResponse(pdf, content_type='application/pdf')
        
        if filename is None:
            filename = f"{self.tipo_documento}_{self.documento.numero or self.documento.id}"
        
        response['Content-Disposition'] = f'inline; filename="{filename}.pdf"'
        return response
    
    def get_download_response(self, filename=None):
        """Genera respuesta HTTP para descarga del PDF"""
        response = self.get_response(filename)
        response['Content-Disposition'] = response['Content-Disposition'].replace('inline', 'attachment')
        return response


def generate_document_pdf(documento, download=False, filename=None):
    """
    Función helper para generar PDF de cualquier documento de venta.
    
    Args:
        documento: Instancia de Factura, Presupuesto, Pedido, Albaran o Ticket
        download: Si True, fuerza descarga. Si False, muestra en navegador
        filename: Nombre personalizado del archivo
    
    Returns:
        HttpResponse con el PDF
    """
    generator = PDFDocumentGenerator(documento)
    
    if download:
        return generator.get_download_response(filename)
    else:
        return generator.get_response(filename)
