# 📚 Documentación de API - Sistema de Gestión Empresarial

## 🏗️ Arquitectura Modular

La API está organizada en **5 apps temáticas** siguiendo principios DRY y separación de responsabilidades:

- **`core/`** - Modelos base y entidades transversales
- **`products/`** - Gestión de productos y catálogo
- **`sales/`** - Documentos comerciales y ventas
- **`hr/`** - Recursos humanos
- **`projects/`** - Gestión de proyectos

---

## 🔗 Endpoints Principales

### **1. Core - Modelos Base** `/api/core/`

#### **👥 Clientes**
```http
GET    /api/core/clientes/           # Listar clientes
POST   /api/core/clientes/           # Crear cliente
GET    /api/core/clientes/{id}/      # Obtener cliente
PUT    /api/core/clientes/{id}/      # Actualizar cliente
DELETE /api/core/clientes/{id}/      # Eliminar cliente
```

**Modelo Cliente:**
```json
{
  "id": 1,
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@empresa.com",
  "telefono": "666123456",
  "direccion": "C/ Principal, 123",
  "ciudad": "Madrid",
  "codigo_postal": "28001",
  "pais": "España"
}
```

---

### **2. Products - Gestión de Productos** `/api/products/`

#### **📂 Categorías**
```http
GET    /api/products/categorias/     # Listar categorías
POST   /api/products/categorias/     # Crear categoría
GET    /api/products/categorias/{id}/ # Obtener categoría
PUT    /api/products/categorias/{id}/ # Actualizar categoría
DELETE /api/products/categorias/{id}/ # Eliminar categoría
```

#### **🏷️ Marcas**
```http
GET    /api/products/marcas/         # Listar marcas
POST   /api/products/marcas/         # Crear marca
GET    /api/products/marcas/{id}/    # Obtener marca
PUT    /api/products/marcas/{id}/    # Actualizar marca
DELETE /api/products/marcas/{id}/    # Eliminar marca
```

#### **📦 Artículos**
```http
GET    /api/products/articulos/      # Listar artículos
POST   /api/products/articulos/      # Crear artículo
GET    /api/products/articulos/{id}/ # Obtener artículo
PUT    /api/products/articulos/{id}/ # Actualizar artículo
DELETE /api/products/articulos/{id}/ # Eliminar artículo
```

**Modelo Artículo:**
```json
{
  "id": 1,
  "nombre": "Laptop Dell XPS 13",
  "descripcion": "Ultrabook profesional",
  "modelo": "XPS-13-2024",
  "precio": 1299.99,
  "stock": 15,
  "iva": 21.0,
  "categoria": 1,
  "marca": 2
}
```

---

### **3. Sales - Documentos Comerciales** `/api/sales/`

#### **💰 Presupuestos**
```http
GET    /api/sales/presupuestos/               # Listar presupuestos
POST   /api/sales/presupuestos/               # Crear presupuesto
GET    /api/sales/presupuestos/{id}/          # Obtener presupuesto
PUT    /api/sales/presupuestos/{id}/          # Actualizar presupuesto
DELETE /api/sales/presupuestos/{id}/          # Eliminar presupuesto
POST   /api/sales/presupuestos/{id}/convertir_a_factura/ # Convertir a factura
```

#### **📋 Pedidos**
```http
GET    /api/sales/pedidos/                    # Listar pedidos
POST   /api/sales/pedidos/                    # Crear pedido
GET    /api/sales/pedidos/{id}/               # Obtener pedido
PUT    /api/sales/pedidos/{id}/               # Actualizar pedido
DELETE /api/sales/pedidos/{id}/               # Eliminar pedido
POST   /api/sales/pedidos/{id}/convertir_a_factura/ # Convertir a factura
```

#### **📤 Albaranes**
```http
GET    /api/sales/albaranes/                  # Listar albaranes
POST   /api/sales/albaranes/                  # Crear albarán
GET    /api/sales/albaranes/{id}/             # Obtener albarán
PUT    /api/sales/albaranes/{id}/             # Actualizar albarán
DELETE /api/sales/albaranes/{id}/             # Eliminar albarán
POST   /api/sales/albaranes/{id}/convertir_a_factura/ # Convertir a factura
```

#### **🧾 Tickets**
```http
GET    /api/sales/tickets/                    # Listar tickets
POST   /api/sales/tickets/                    # Crear ticket
GET    /api/sales/tickets/{id}/               # Obtener ticket
PUT    /api/sales/tickets/{id}/               # Actualizar ticket
DELETE /api/sales/tickets/{id}/               # Eliminar ticket
POST   /api/sales/tickets/{id}/convertir_a_factura/ # Convertir a factura
```

#### **📄 Facturas**
```http
GET    /api/sales/facturas/                   # Listar facturas
POST   /api/sales/facturas/                   # Crear factura
GET    /api/sales/facturas/{id}/              # Obtener factura
PUT    /api/sales/facturas/{id}/              # Actualizar factura
DELETE /api/sales/facturas/{id}/              # Eliminar factura
POST   /api/sales/facturas/crear_desde_documento/ # Crear desde otro documento
```

**Estructura de Documento de Venta:**
```json
{
  "id": 1,
  "numero": "PRES-2024-001",
  "fecha": "2024-06-23",
  "cliente": 1,
  "subtotal": 1000.00,
  "iva_total": 210.00,
  "total": 1210.00,
  "is_facturado": false,
  "items": [
    {
      "id": 1,
      "articulo": 1,
      "cantidad": 2,
      "precio_unitario": 500.00,
      "iva": 21.0,
      "subtotal": 1000.00,
      "total": 1210.00
    }
  ]
}
```

---

### **4. HR - Recursos Humanos** `/api/hr/`

#### **🏢 Departamentos**
```http
GET    /api/hr/departamentos/        # Listar departamentos
POST   /api/hr/departamentos/        # Crear departamento
GET    /api/hr/departamentos/{id}/   # Obtener departamento
PUT    /api/hr/departamentos/{id}/   # Actualizar departamento
DELETE /api/hr/departamentos/{id}/   # Eliminar departamento
```

#### **👨‍💼 Empleados**
```http
GET    /api/hr/empleados/            # Listar empleados
POST   /api/hr/empleados/            # Crear empleado
GET    /api/hr/empleados/{id}/       # Obtener empleado
PUT    /api/hr/empleados/{id}/       # Actualizar empleado
DELETE /api/hr/empleados/{id}/       # Eliminar empleado
```

---

### **5. Projects - Gestión de Proyectos** `/api/projects/`

#### **📋 Proyectos**
```http
GET    /api/projects/proyectos/      # Listar proyectos
POST   /api/projects/proyectos/      # Crear proyecto
GET    /api/projects/proyectos/{id}/ # Obtener proyecto
PUT    /api/projects/proyectos/{id}/ # Actualizar proyecto
DELETE /api/projects/proyectos/{id}/ # Eliminar proyecto
```

---

### **6. Reports - Reportes Centralizados** `/api/reportes/`

#### **📊 Endpoints de Reportes**
```http
GET /api/reportes/ventas_resumen/?fecha_desde=2024-01-01&fecha_hasta=2024-12-31
    # Resumen de ventas por tipo de documento

GET /api/reportes/productos_mas_vendidos/?fecha_desde=2024-01-01&fecha_hasta=2024-12-31
    # Top productos más vendidos

GET /api/reportes/stock_bajo/?limite=10
    # Productos con stock bajo

GET /api/reportes/facturacion_mensual/
    # Estadísticas de facturación de los últimos 12 meses
```

**Ejemplo Respuesta Ventas Resumen:**
```json
{
  "presupuestos": {
    "count": 15,
    "total": 25000.00
  },
  "pedidos": {
    "count": 12,
    "total": 18000.00
  },
  "facturas": {
    "count": 8,
    "total": 15000.00
  }
}
```

---

## 🛠️ Funcionalidades Avanzadas

### **🔒 Protección de Documentos Facturados**

El sistema incluye el **`ReadOnlyIfInvoicedMixin`** que previene:
- ✅ Edición de documentos ya facturados
- ✅ Eliminación de documentos ya facturados
- ✅ Mantiene integridad de datos fiscales

### **🔄 Conversión de Documentos**

El **`DocumentConversionMixin`** permite:
- Presupuesto → Factura
- Pedido → Factura  
- Albarán → Factura
- Ticket → Factura

**Uso:**
```http
POST /api/sales/presupuestos/{id}/convertir_a_factura/
POST /api/sales/facturas/crear_desde_documento/
{
  "documento_tipo": "presupuesto",
  "documento_id": 5
}
```

### **📈 Cálculos Automáticos**

- **Totales automáticos** mediante señales Django
- **Recálculo en tiempo real** al modificar items
- **Agrupación por IVA** para cumplimiento fiscal
- **Validaciones de negocio** integradas

---

## 🏗️ Arquitectura DRY Implementada

### **📋 Modelos Base Abstractos**

#### **`AbstractBaseDocument`** (core/models.py)
```python
class AbstractBaseDocument(models.Model):
    cliente = models.ForeignKey('core.Cliente', on_delete=models.CASCADE)
    fecha = models.DateField(auto_now_add=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    iva_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_facturado = models.BooleanField(default=False)
    
    class Meta:
        abstract = True
        
    @property
    def numero_formateado(self):
        """Genera número de documento con formato específico"""
        # Implementación automática
    
    def recalcular_totales(self):
        """Recalcula totales desde los items"""
        # Lógica centralizada
```

#### **`AbstractBaseItem`** (core/models.py)
```python
class AbstractBaseItem(models.Model):
    articulo = models.ForeignKey('products.Articulo', on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    iva = models.DecimalField(max_digits=5, decimal_places=2)
    
    class Meta:
        abstract = True
    
    @property
    def subtotal(self):
        return self.cantidad * self.precio_unitario
    
    @property 
    def total(self):
        return self.subtotal * (1 + self.iva / 100)
```

### **🔧 Mixins Reutilizables**

- **`ReadOnlyIfInvoicedMixin`**: Protección fiscal
- **`DocumentConversionMixin`**: Conversión entre documentos
- **Filtros y búsquedas**: Implementación consistente

---

## 📄 Sistema de Generación de PDF ✅ **IMPLEMENTADO**

### **🎯 Funcionalidad Completa**

El sistema de generación de PDF está **completamente implementado** y funcional para todos los documentos de venta:

- ✅ **Presupuestos** → PDF profesional
- ✅ **Pedidos** → PDF con detalles de pedido  
- ✅ **Albaranes** → PDF de entrega
- ✅ **Tickets** → PDF de venta
- ✅ **Facturas** → PDF con cumplimiento fiscal

### **🔗 Endpoints de PDF Disponibles**

#### **Para cada tipo de documento:**
```http
# PRESUPUESTOS
GET /api/sales/presupuestos/{id}/ver_pdf/        # Ver en navegador
GET /api/sales/presupuestos/{id}/generar_pdf/    # Descargar archivo

# PEDIDOS  
GET /api/sales/pedidos/{id}/ver_pdf/             # Ver en navegador
GET /api/sales/pedidos/{id}/generar_pdf/         # Descargar archivo

# ALBARANES
GET /api/sales/albaranes/{id}/ver_pdf/           # Ver en navegador  
GET /api/sales/albaranes/{id}/generar_pdf/       # Descargar archivo

# TICKETS
GET /api/sales/tickets/{id}/ver_pdf/             # Ver en navegador
GET /api/sales/tickets/{id}/generar_pdf/         # Descargar archivo

# FACTURAS
GET /api/sales/facturas/{id}/ver_pdf/            # Ver en navegador
GET /api/sales/facturas/{id}/generar_pdf/        # Descargar archivo
```

### **📋 Características del PDF**

#### **✅ Cumplimiento Fiscal Español**
- **Desglose automático por tipos de IVA** 
- **Cálculos precisos** de base imponible y cuotas
- **Numeración correlativa** por tipo de documento
- **Formato profesional** acorde a normativa

#### **📊 Contenido Completo**
1. **Encabezado del documento** con tipo y número
2. **Fecha de emisión** formateada
3. **Datos completos del cliente** (nombre, dirección, contacto)
4. **Tabla detallada de productos** con:
   - Concepto/Artículo
   - Cantidad
   - Precio unitario
   - Porcentaje de IVA
   - Subtotal por línea
   - Total por línea
5. **Desglose por IVA** (cuando hay múltiples tipos)
6. **Totales finales** destacados
7. **Notas específicas** por tipo de documento

#### **🎨 Diseño Profesional**
- **Layout A4** estándar empresarial
- **Tipografías legibles** (Helvetica/Arial)
- **Tablas estructuradas** con bordes y fondos
- **Colores corporativos** (gris/beige)
- **Espaciado óptimo** para lectura

### **🔧 Implementación Técnica**

#### **Generador Modular** (`core/pdf_utils.py`)
```python
from core.pdf_utils import generate_document_pdf

# Generar PDF de cualquier documento
def generar_pdf_view(request, documento_id):
    documento = get_object_or_404(ModeloDocumento, id=documento_id)
    return generate_document_pdf(documento, download=True)
```

#### **Detección Automática de Tipo**
El sistema detecta automáticamente el tipo de documento:
- `Factura` → "FACTURA #123"
- `Presupuesto` → "PRESUPUESTO #456" 
- `Pedido` → "PEDIDO #789"
- `Albaran` → "ALBARÁN #012"
- `Ticket` → "TICKET #345"

#### **Notas Específicas por Documento**
- **Presupuestos**: "Este presupuesto tiene validez de 30 días"
- **Pedidos**: "Pedido pendiente de entrega"
- **Albaranes**: "Mercancía entregada conforme"
- **Tickets/Facturas**: Texto estándar de agradecimiento

### **📱 Uso desde Frontend**

#### **JavaScript/Fetch**
```javascript
// Ver PDF en nueva pestaña
function verPDF(tipoDocumento, id) {
    const url = `/api/sales/${tipoDocumento}/${id}/ver_pdf/`;
    window.open(url, '_blank');
}

// Descargar PDF
function descargarPDF(tipoDocumento, id) {
    const url = `/api/sales/${tipoDocumento}/${id}/generar_pdf/`;
    window.location.href = url;
}

// Ejemplo de uso
verPDF('facturas', 123);        // Ver factura #123
descargarPDF('presupuestos', 456); // Descargar presupuesto #456
```

#### **Botones en Tablas**
```html
<!-- Botón Ver PDF -->
<button onclick="verPDF('facturas', ${factura.id})" 
        class="actionIcon" title="Ver PDF">
    📄
</button>

<!-- Botón Descargar PDF -->  
<button onclick="descargarPDF('facturas', ${factura.id})"
        class="actionIcon" title="Descargar PDF">
    ⬇️
</button>
```

### **⚡ Rendimiento y Optimización**

- **Generación rápida** usando ReportLab
- **Memoria eficiente** con BytesIO
- **Cálculos precisos** con Decimal para evitar errores de flotante
- **Lazy loading** de items por documento
- **Respuestas HTTP optimizadas** para streaming

### **🔍 Desglose Fiscal Automático**

Cuando un documento tiene productos con **diferentes tipos de IVA**, el PDF incluye automáticamente una tabla de desglose:

```
Desglose por Tipo de IVA:
┌─────────────────┬────────┬─────────────┬──────────────┐
│ Base Imponible  │ % IVA  │ Cuota IVA   │ Total        │
├─────────────────┼────────┼─────────────┼──────────────┤
│ 500.00 €       │ 21.0%  │ 105.00 €    │ 605.00 €     │
│ 200.00 €       │ 10.0%  │ 20.00 €     │ 220.00 €     │
│ 100.00 €       │ 4.0%   │ 4.00 €      │ 104.00 €     │
└─────────────────┴────────┴─────────────┴──────────────┘
```

### **🚀 Funcionalidades Avanzadas**

#### **Personalización por Empresa**
```python
# Futuras mejoras posibles
class PDFDocumentGenerator:
    def __init__(self, documento, empresa_config=None):
        # Logo personalizado
        # Colores corporativos
        # Datos fiscales empresa
```

#### **Plantillas Específicas**
- **Facturas**: Formato fiscal completo
- **Presupuestos**: Diseño comercial atractivo  
- **Albaranes**: Formato de entrega simplificado
- **Tickets**: Diseño compacto para punto de venta

---
