# 🏢 API de Gestión Empresarial Multi-Tenant/empresa con JWT

## 🚀 Características Principales

- ✅ **Multi-Tenancy**: Aislamiento completo de datos por empresa
- ✅ **Autenticación JWT**: Tokens seguros con refresh automático  
- ✅ **Arquitectura Modular**: 11 apps Django especializadas
- ✅ **Roles y Permisos**: SuperAdmin, EmpresaAdmin, Usuario
- ✅ **Invitaciones**: Invitar usuarios por email
- ✅ **Gestión de Almacenes**: Control multi-almacén con stock granular
- ✅ **Gestión de Compras**: Pedidos, albaranes, facturas de compra y cuentas por pagar
- ✅ **Automaticación de descuento de stock**: Al crear un documento de venta, se descontará el stock automáticamente
- ✅ **Logs de Auditoría**: Logs de auditoría para trazabilidad completa (quien ha hecho qué y cuándo)
- ✅ **Dockerizado**: Despliegue simple con Docker Compose
- ✅ **Base de Datos**: MySQL 8.0 con phpMyAdmin
- ✅ **Documentación**: Documentación completa de la API con OpenAPI
- ✅ **API REST**: Endpoints completos con Django REST Framework
- ✅ **Generación PDF**: Facturas, presupuestos, albaranes y tickets
- ✅ **Gestión de PDFs**: Almacenamiento persistente (S3/local) y envío por email

---

## 🏗️ Arquitectura Multi-Tenant

### **Jerarquía de Usuarios**
```
SuperAdmin (admin)
├── Acceso global a todas las empresas
├── Gestión de empresas y administradores
└── Sin restricciones de tenant

EmpresaAdmin (admin_tecno, admin_lopez)
├── Gestión completa de SU empresa
├── Crear/editar e invitar usuarios de su empresa
└── Acceso a todos los módulos de su empresa

Usuario (ventas_678, almacen_678, etc.)
├── Acceso limitado a SU empresa
├── Permisos específicos por rol
└── Solo datos de su empresa
```

## 🐳 Instalación y Despliegue

### **Prerequisitos**
- Docker y Docker Compose
- Puerto 8000 (API), 3306 (MySQL), 8080 (phpMyAdmin) libres

### **Comandos de Inicio**
```bash
# Clonar el repositorio
git clone <repo-url>
cd MiniGestion

# Crear archivo .env
cp .env.example .env # Editar variables de entorno según sea necesario

# Iniciar servicios
docker-compose up --build

# La API estará disponible en:
# API: http://localhost:8000
# phpMyAdmin: http://localhost:8080
```

### **Empresas de Ejemplo**
- **TecnoSoluciones S.L.** (CIF: B12345678)
- **Comercial López e Hijos S.A.** (CIF: A87654321)

---

## 🔐 Autenticación JWT

### **Endpoints de Autenticación**
```http
POST /api/auth/login/          # Obtener token JWT
POST /api/auth/refresh/        # Renovar token
POST /api/auth/verify/         # Verificar token
GET  /api/auth/me/            # Perfil del usuario
```

### **Estructura del Token JWT**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 2,
    "username": "admin_tecno",
    "role": "empresa_admin",
    "empresa": {
      "id": 1,
      "nombre": "TecnoSoluciones S.L.",
      "cif": "B12345678"
    }
  }
}
```
---

## 📧 Registro Público e Invitaciones

### **🚀 Registro Público de Empresas**
Permite que cualquier persona registre una nueva empresa y se convierta automáticamente en su administrador:

```http
POST /api/accounts/public/register-empresa/
```

**Payload de ejemplo:**
```json
{
  "empresa": {
    "nombre": "Mi Nueva Empresa S.L.",
    "cif": "B98765432",
    "email": "contacto@minuevaempresa.com",
    "telefono": "666777888",
    "direccion": "Calle Nueva 123",
    "plan": "basico"
  },
  "admin": {
    "username": "admin_nueva",
    "email": "admin@minuevaempresa.com",
    "password": "password123",
    "password_confirm": "password123",
    "first_name": "Admin",
    "last_name": "Nuevo"
  },
  "terms_accepted": true
}
```

**Respuesta exitosa:**
- ✅ Empresa creada automáticamente
- ✅ Usuario admin creado con permisos completos
- ✅ Tokens JWT para login inmediato
- ✅ Email de bienvenida enviado

### **👥 Sistema de Invitaciones por Email**

Los administradores pueden invitar usuarios por email sin crear cuentas manualmente:

#### **Crear Invitación**
```http
POST /api/accounts/invite/
```

**Payload:**
```json
{
  "email": "usuario@ejemplo.com",
  "first_name": "Juan",
  "last_name": "Pérez",
  "role": "employee",
  "cargo": "Vendedor",
  "message": "¡Únete a nuestro equipo!"
}
```

#### **Ver Invitación (público)**
```http
GET /api/accounts/invitation/{token}/
```

#### **Aceptar Invitación (público)**
```http
POST /api/accounts/invitation/accept/
```

**Payload:**
```json
{
  "token": "abc123...",
  "username": "juan_vendedor",
  "password": "password123",
  "password_confirm": "password123"
}
```

#### **Gestionar Invitaciones (ViewSet)**
```http
GET    /api/accounts/invitations/          # Listar invitaciones
POST   /api/accounts/invitations/          # Crear invitación
GET    /api/accounts/invitations/{id}/     # Ver invitación
DELETE /api/accounts/invitations/{id}/     # Eliminar invitación
POST   /api/accounts/invitations/{id}/cancel/  # Cancelar invitación
POST   /api/accounts/invitations/{id}/resend/  # Reenviar email
```

### **⚙️ Configuración de Email**

Para que funcione el sistema, configura las variables de entorno en `.env`:

```bash
# Configuración SMTP (usando Brevo/SendinBlue)
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_HOST_USER=tu_email@ejemplo.com
EMAIL_HOST_PASSWORD=tu_password_smtp
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@tudominio.com

# URL Frontend para enlaces en emails
FRONTEND_URL=http://localhost:3000

# Expiración de invitaciones (días)
INVITATION_EXPIRY_DAYS=7
```

### **🔒 Permisos y Seguridad**

- **Registro Público**: Sin autenticación (endpoint público)
- **Crear Invitaciones**: Solo SuperAdmin y EmpresaAdmin
- **Ver/Aceptar Invitaciones**: Público con token válido
- **Gestionar Invitaciones**: Solo quien las envió o SuperAdmin
- **Límites de Plan**: Se respetan los límites de usuarios por empresa

### **📱 Estados de Invitación**

| Estado | Descripción |
|--------|------------|
| `pending` | Invitación enviada, esperando aceptación |
| `accepted` | Usuario registrado exitosamente |
| `expired` | Invitación expirada (>7 días) |
| `cancelled` | Cancelada por el administrador |

### **Datos Iniciales Cargados**
```
Superusuario: admin / admin123
TecnoSoluciones:
  - admin_tecno / tecno123
  - ventas_678 / pass123
  - almacen_678 / pass123

Comercial López:
  - admin_lopez / lopez123  
  - ventas_321 / pass123
  - almacen_321 / pass123
```

---

## 🏗️ Arquitectura Modular

La API está organizada en **8 apps Django** con aislamiento de tenants:

### **`accounts/`** - Autenticación y Multi-Tenancy
- **CustomUser**: Usuario con empresa y roles
- **Empresa**: Modelo central de tenant
- **UserInvitation**: Sistema de invitaciones por email
- **JWT Views**: Login, refresh, verify, me
- **Public Registration**: Registro público de empresas
- **Invitation System**: Invitar usuarios por email

### **`tenants/`** - Middleware y Utilidades  
- **TenantMiddleware**: Filtrado automático por empresa
- **ThreadLocalMiddleware**: Contexto de request
- **Permissions**: Control de acceso por roles

### **`core/`** - Modelos Base
- **Cliente**: Clientes por empresa
- **Proveedor**: Proveedores por empresa
- **Contacto**: Contactos por empresa (conjunto de clientes y proveedores)
- **Serie**: Series de numeración asociadas a almacenes para control de stock
- **AbstractBaseDocument**: Base para documentos
- **AbstractBaseItem**: Base para items de documentos

### **`products/`** - Gestión de Productos
- **Categoría**: Categorías de productos por empresa
- **Marca**: Marcas por empresa  
- **Artículo**: Productos con stock e IVA

### **`sales/`** - Documentos Comerciales
- **Presupuesto, Pedido, Albarán, Ticket, Factura**
- **Items correspondientes** para cada documento
- **Conversión automática** entre documentos

### **`hr/`** - Recursos Humanos
- **Departamento**: Departamentos por empresa
- **Empleado**: Empleados con salarios y fechas

### **`projects/`** - Gestión de Proyectos  
- **Proyecto**: Proyectos con empleados asignados

### **`pos/`** - TPV (Terminal Punto de Venta)
- **CajaSession**: Sesiones de caja con estados y saldos
- **MovimientoCaja**: Movimientos (ventas, entradas, salidas) 
- **CuadreCaja**: Conciliación automática de caja

### **`inventory/`** - Gestión de Almacenes y Stock
- **Almacen**: Almacenes por empresa con responsables
- **ArticuloStock**: Stock por artículo y almacén con umbrales
- **MovimientoStock**: Auditoría completa de movimientos
- **TransferenciaStock**: Transferencias entre almacenes

### **`documents/`** - Gestión de PDFs y Email
- **DocumentoPDF**: Almacenamiento persistente de PDFs generados
- **Almacenamiento S3/Local**: Configuración flexible de almacenamiento
- **Envío por Email**: Integración SMTP para enviar PDFs adjuntos o enlaces
- **Versionado**: Control de versiones de documentos para evitar duplicados

---

## 🔗 Endpoints Principales (Multi-Tenant)

> **Importante**: Todos los endpoints requieren autenticación JWT y respetan el aislamiento por empresa automáticamente.

### **🔐 Autenticación**
```http
POST   /api/auth/login/           # Login con username/password
POST   /api/auth/refresh/         # Renovar token JWT  
POST   /api/auth/verify/          # Verificar token
GET    /api/auth/me/             # Datos del usuario autenticado
```

### **🏢 Gestión de Empresas** (Solo SuperAdmin)
```http
GET    /api/accounts/empresas/     # Listar empresas
POST   /api/accounts/empresas/     # Crear empresa
GET    /api/accounts/empresas/{id}/ # Obtener empresa
PUT    /api/accounts/empresas/{id}/ # Actualizar empresa
```

### **👤 Gestión de Usuarios** (SuperAdmin y EmpresaAdmin)
```http
GET    /api/accounts/users/        # Listar usuarios (filtrados por empresa)
POST   /api/accounts/users/        # Crear usuario
GET    /api/accounts/users/{id}/   # Obtener usuario
PUT    /api/accounts/users/{id}/   # Actualizar usuario
```

### **📈 Gestión de Clientes** (EmpresaAdmin y Usuario)
```http
GET    /api/core/clientes/         # Listar clientes
POST   /api/core/clientes/         # Crear cliente
GET    /api/core/clientes/{id}/    # Obtener cliente
PUT    /api/core/clientes/{id}/    # Actualizar cliente
```

### **📈 Gestión de Proveedores** (EmpresaAdmin y Usuario)
```http
GET    /api/core/proveedores/         # Listar proveedores
POST   /api/core/proveedores/         # Crear proveedor
GET    /api/core/proveedores/{id}/    # Obtener proveedor
PUT    /api/core/proveedores/{id}/    # Actualizar proveedor
DELETE /api/core/proveedores/{id}/    # Eliminar proveedor
```

### **🛒 Gestión de Compras** (EmpresaAdmin y Usuario)

#### **Pedidos de Compra**
```http
GET    /api/purchases/pedidos/        # Listar pedidos de compra
POST   /api/purchases/pedidos/        # Crear pedido de compra
GET    /api/purchases/pedidos/{id}/   # Obtener pedido
PUT    /api/purchases/pedidos/{id}/   # Actualizar pedido
DELETE /api/purchases/pedidos/{id}/   # Eliminar pedido
POST   /api/purchases/pedidos/{id}/recibir_mercancia/  # Generar albarán
```

#### **Albaranes de Compra**
```http
GET    /api/purchases/albaranes/      # Listar albaranes de compra
POST   /api/purchases/albaranes/      # Crear albarán
GET    /api/purchases/albaranes/{id}/ # Obtener albarán
PUT    /api/purchases/albaranes/{id}/ # Actualizar albarán
POST   /api/purchases/albaranes/{id}/crear_factura/    # Generar factura
```

#### **Facturas de Compra**
```http
GET    /api/purchases/facturas/       # Listar facturas de compra
POST   /api/purchases/facturas/       # Crear factura
GET    /api/purchases/facturas/{id}/  # Obtener factura
PUT    /api/purchases/facturas/{id}/  # Actualizar factura
```

#### **Cuentas por Pagar**
```http
GET    /api/purchases/cuentas-por-pagar/     # Listar cuentas por pagar
POST   /api/purchases/cuentas-por-pagar/     # Crear cuenta por pagar
GET    /api/purchases/cuentas-por-pagar/{id}/# Obtener cuenta
PUT    /api/purchases/cuentas-por-pagar/{id}/# Actualizar cuenta
GET    /api/purchases/cuentas-por-pagar/resumen/ # Resumen de pagos pendientes
```

### **📞 Contactos** (EmpresaAdmin y Usuario)
```http
GET    /api/core/contactos/         # Listar contactos (agrupación de clientes y proveedores)
```

### **📑 Series de Numeración** (EmpresaAdmin y Usuario)
```http
GET    /api/core/series/            # Listar series de numeración
POST   /api/core/series/            # Crear serie
GET    /api/core/series/{id}/       # Obtener serie
PUT    /api/core/series/{id}/       # Actualizar serie
DELETE /api/core/series/{id}/       # Eliminar serie
```

**Funcionalidad de Series:**
- **Asociación con Almacén**: Cada serie está vinculada a un almacén específico
- **Control de Stock**: Los documentos de venta utilizan la serie para determinar desde qué almacén descontar stock
- **Multi-tenancy**: Las series están aisladas por empresa
- **Estado Activo/Inactivo**: Control de series habilitadas para uso

### **📦 Gestión de Productos** (EmpresaAdmin y Usuario)
```http
GET    /api/products/categorias/     # Listar categorías
POST   /api/products/categorias/     # Crear categoría
GET    /api/products/categorias/{id}/ # Obtener categoría
PUT    /api/products/categorias/{id}/ # Actualizar categoría

GET    /api/products/marcas/         # Listar marcas
POST   /api/products/marcas/         # Crear marca
GET    /api/products/marcas/{id}/    # Obtener marca
PUT    /api/products/marcas/{id}/    # Actualizar marca

GET    /api/products/articulos/      # Listar artículos
POST   /api/products/articulos/      # Crear artículo
GET    /api/products/articulos/{id}/ # Obtener artículo
PUT    /api/products/articulos/{id}/ # Actualizar artículo
```

### **📋 Gestión de Documentos** (EmpresaAdmin y Usuario)
```http
GET    /api/sales/presupuestos/               # Listar presupuestos
POST   /api/sales/presupuestos/               # Crear presupuesto
GET    /api/sales/presupuestos/{id}/          # Obtener presupuesto
PUT    /api/sales/presupuestos/{id}/          # Actualizar presupuesto

GET    /api/sales/pedidos/                    # Listar pedidos
POST   /api/sales/pedidos/                    # Crear pedido
GET    /api/sales/pedidos/{id}/               # Obtener pedido
PUT    /api/sales/pedidos/{id}/               # Actualizar pedido

GET    /api/sales/albaranes/                  # Listar albaranes
POST   /api/sales/albaranes/                  # Crear albarán
GET    /api/sales/albaranes/{id}/             # Obtener albarán
PUT    /api/sales/albaranes/{id}/             # Actualizar albarán

GET    /api/sales/tickets/                    # Listar tickets
POST   /api/sales/tickets/                    # Crear ticket
GET    /api/sales/tickets/{id}/               # Obtener ticket
PUT    /api/sales/tickets/{id}/               # Actualizar ticket

GET    /api/sales/facturas/                   # Listar facturas
POST   /api/sales/facturas/                   # Crear factura
GET    /api/sales/facturas/{id}/              # Obtener factura
PUT    /api/sales/facturas/{id}/              # Actualizar factura
```

### **📊 Reportes y Estadísticas** (EmpresaAdmin y Usuario)
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

### **🏪 TPV (Terminal Punto de Venta)** (EmpresaAdmin y Usuario)

El módulo TPV permite gestionar sesiones de caja, movimientos de efectivo y cuadres automáticos con aislamiento multi-tenant completo.

#### **Gestión de Sesiones de Caja**
```http
GET    /api/pos/sesiones/              # Listar sesiones de caja
POST   /api/pos/sesiones/              # Crear nueva sesión
GET    /api/pos/sesiones/{id}/         # Obtener sesión específica
PUT    /api/pos/sesiones/{id}/         # Actualizar sesión

# Endpoints especiales
GET    /api/pos/sesiones/activa/       # Obtener sesión activa del usuario
POST   /api/pos/sesiones/abrir_nueva/  # Abrir nueva sesión si no hay activa
POST   /api/pos/sesiones/{id}/cerrar_caja/  # Cerrar sesión con cuadre automático
GET    /api/pos/sesiones/{id}/resumen/      # Resumen detallado de la sesión
```

#### **Gestión de Movimientos de Caja**
```http
GET    /api/pos/movimientos/           # Listar movimientos
POST   /api/pos/movimientos/           # Crear movimiento
GET    /api/pos/movimientos/{id}/      # Obtener movimiento
PUT    /api/pos/movimientos/{id}/      # Actualizar movimiento
```

#### **Gestión de Cuadres de Caja**
```http
GET    /api/pos/cuadres/               # Listar cuadres
POST   /api/pos/cuadres/               # Crear cuadre manual
GET    /api/pos/cuadres/{id}/          # Obtener cuadre
```

#### **Estadísticas TPV**
```http
GET    /api/pos/estadisticas/dashboard/  # Dashboard con estadísticas TPV
```

#### **Características TPV**
- ✅ **Sesiones de Caja**: Estados (abierta/cerrada/suspendida)
- ✅ **Movimientos Diversos**: Ventas, devoluciones, entradas/salidas
- ✅ **Pagos Mixtos**: Soporte efectivo + tarjeta en una transacción
- ✅ **Cuadre Automático**: Al cerrar sesión se calcula automáticamente
- ✅ **Multi-Tenancy**: Aislamiento completo por empresa
- ✅ **Permisos Granulares**: Solo propietarios y admins pueden cerrar cajas
- ✅ **Auditoría Completa**: Timestamps y trazabilidad
- ✅ **Validaciones de Negocio**: Solo una sesión activa por usuario

### **🏭 Inventory (Gestión de Almacenes y Stock)** (EmpresaAdmin y Usuario)

El módulo inventory permite gestionar múltiples almacenes por empresa, controlar stock por artículo y almacén, auditar movimientos y realizar transferencias entre almacenes con control total multi-tenant.

#### **Gestión de Almacenes**
```http
GET    /api/inventory/almacenes/              # Listar almacenes
POST   /api/inventory/almacenes/              # Crear almacén
GET    /api/inventory/almacenes/{id}/         # Obtener almacén
PUT    /api/inventory/almacenes/{id}/         # Actualizar almacén
DELETE /api/inventory/almacenes/{id}/         # Eliminar almacén

# Endpoints especiales
GET    /api/inventory/almacenes/principal/    # Obtener almacén principal
GET    /api/inventory/almacenes/{id}/stock/   # Stock del almacén
GET    /api/inventory/almacenes/{id}/movimientos/ # Movimientos del almacén
```

#### **Gestión de Stock por Artículo**
```http
GET    /api/inventory/stock/                  # Listar stock por artículo/almacén
POST   /api/inventory/stock/                  # Crear registro de stock
GET    /api/inventory/stock/{id}/             # Obtener stock específico
PUT    /api/inventory/stock/{id}/             # Actualizar stock
DELETE /api/inventory/stock/{id}/             # Eliminar registro

# Endpoints especiales
GET    /api/inventory/stock/resumen/          # Resumen consolidado por artículo
GET    /api/inventory/stock/alertas/          # Alertas de stock bajo
POST   /api/inventory/stock/ajuste_masivo/    # Ajustes masivos de stock
```

#### **Auditoría de Movimientos**
```http
GET    /api/inventory/movimientos/            # Listar movimientos (solo lectura)
GET    /api/inventory/movimientos/{id}/       # Obtener movimiento específico

# Endpoints especiales
POST   /api/inventory/movimientos/crear_movimiento/  # Crear movimiento manual
GET    /api/inventory/movimientos/estadisticas/      # Estadísticas de movimientos
```

#### **Transferencias entre Almacenes**
```http
GET    /api/inventory/transferencias/         # Listar transferencias
POST   /api/inventory/transferencias/         # Crear transferencia
GET    /api/inventory/transferencias/{id}/    # Obtener transferencia
PUT    /api/inventory/transferencias/{id}/    # Actualizar transferencia
DELETE /api/inventory/transferencias/{id}/    # Eliminar transferencia

# Endpoints de workflow
POST   /api/inventory/transferencias/{id}/enviar/    # Enviar transferencia
POST   /api/inventory/transferencias/{id}/recibir/   # Recibir transferencia  
POST   /api/inventory/transferencias/{id}/cancelar/  # Cancelar transferencia
POST   /api/inventory/transferencias/{id}/agregar_item/ # Agregar artículo a transferencia
```

#### **Características Inventory**
- ✅ **Multi-Almacén**: Gestión de múltiples almacenes por empresa
- ✅ **Stock Granular**: Control de stock por artículo y almacén
- ✅ **Umbrales Inteligentes**: Stock mínimo/máximo con alertas automáticas
- ✅ **Auditoría Completa**: Todos los movimientos quedan registrados
- ✅ **Transferencias**: Workflow completo entre almacenes (pendiente → enviado → recibido)
- ✅ **Reservas de Stock**: Control de stock disponible vs reservado
- ✅ **Ubicaciones**: Sistema de ubicaciones dentro de cada almacén
- ✅ **Valoración**: Precios unitarios y valoración total del stock
- ✅ **Transacciones Atómicas**: Consistencia garantizada en todas las operaciones
- ✅ **Multi-Tenancy**: Aislamiento completo por empresa
- ✅ **Migración Automática**: Migra stock existente de `products.Articulo`

### **📊 Gestión de PDFs y Email** (EmpresaAdmin y Usuario)

#### **Gestionar PDFs de Documentos**
```http
GET    /api/documents/pdfs/                    # Listar PDFs generados
POST   /api/documents/pdfs/                    # Crear PDF manualmente
GET    /api/documents/pdfs/{id}/               # Obtener detalles del PDF
DELETE /api/documents/pdfs/{id}/               # Eliminar PDF

# Acciones especiales
GET    /api/documents/pdfs/{id}/descargar/     # Descargar PDF
GET    /api/documents/pdfs/{id}/ver_inline/    # Ver PDF en navegador
POST   /api/documents/pdfs/{id}/enviar_email/  # Enviar PDF por email
GET    /api/documents/pdfs/estadisticas/       # Estadísticas de uso
```

#### **Características de Documents**
- ✅ **Almacenamiento Persistente**: S3 (producción) o local (desarrollo)
- ✅ **Envío por Email**: PDFs como adjunto o enlace de descarga
- ✅ **Control de Versiones**: Evita PDFs duplicados con hash de documento
- ✅ **Estadísticas**: Seguimiento de envíos y descargas
- ✅ **Multi-Tenancy**: Aislamiento completo por empresa
- ✅ **Filtros Avanzados**: Por tipo de documento, estado de envío, fecha
- ✅ **Integración SMTP**: Usa configuración existente de email del sistema

---

## 📄 Guía de Pruebas

### **Pruebas Unitarias**
```bash
# Ejecutar pruebas unitarias
python manage.py test
```

### **Pruebas de Integración**
```bash
# Ejecutar pruebas de integración
python manage.py test --tag=integration
```

### **Pruebas de API**
```bash
# Ejecutar pruebas de API
python manage.py test --tag=api
```

### **Pruebas de UI**
```bash
# Ejecutar pruebas de UI
python manage.py test --tag=ui
```

---

## 📈 Despliegue en Producción

### **Configuración de Entorno**
```bash
# Crear archivo .env en el directorio raíz
cp .env.example .env

# Editar variables de entorno según sea necesario
nano .env
```

### **Despliegue con Docker Compose**
```bash
# Iniciar servicios en segundo plano
docker-compose up -d

# Verificar estado de los servicios
docker-compose ps
```

### **Acceso a la API**
```bash
# La API estará disponible en:
# API: http://localhost:8000
# phpMyAdmin: http://localhost:8080
```
---

## 🧪 Guía de Pruebas con Postman - 10 Ejemplos Prácticos

### **🔧 Configuración Inicial de Postman**

1. **Crear una nueva colección**: `MiniGestion Multi-Tenant API`
2. **Configurar variables de entorno**:
   - `base_url`: `http://localhost:8000`
   - `access_token`: (se llenará automáticamente)
   - `empresa_id`: (se llenará automáticamente)

### **📋 Tests Paso a Paso**

---

#### **Test 1: 🔐 Autenticación - Login como SuperAdmin**

```http
POST {{base_url}}/api/auth/login/
Content-Type: application/json

{
  "username": "admin", 
  "password": "admin123"
}
```

**Script Post-Response (Tests tab):**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("access_token", response.access);
    pm.environment.set("refresh_token", response.refresh);
    console.log("✅ Login exitoso como SuperAdmin");
    console.log("Usuario:", response.user.username);
    console.log("Rol:", response.user.role);
}
```

**Resultado Esperado**: Token JWT y datos del superadmin sin empresa asignada.

---

#### **Test 2: 🏢 Listar Empresas (Solo SuperAdmin)**

```http
GET {{base_url}}/api/auth/empresas/
Authorization: Bearer {{access_token}}
```

**Resultado Esperado**: Lista con TecnoSoluciones y Comercial López.

---

#### **Test 3: 🔐 Login como Admin de Empresa**

```http
POST {{base_url}}/api/auth/login/
Content-Type: application/json

{
  "username": "admin_tecno",
  "password": "tecno123"
}
```

**Script Post-Response:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("access_token", response.access);
    pm.environment.set("empresa_id", response.user.empresa.id);
    console.log("✅ Login exitoso como Admin de Empresa");
    console.log("Empresa:", response.user.empresa.nombre);
    console.log("CIF:", response.user.empresa.cif);
}
```

**Resultado Esperado**: Token JWT con datos de TecnoSoluciones S.L.

---

#### **Test 4: 📦 Listar Productos (Filtrados por Empresa)**

```http
GET {{base_url}}/api/products/articulos/
Authorization: Bearer {{access_token}}
```

**Resultado Esperado**: Solo productos de TecnoSoluciones (Samsung, Apple, Sony, etc.).

---

#### **Test 5: ➕ Crear Nuevo Cliente**

```http
POST {{base_url}}/api/core/clientes/
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "nombre": "Empresa ABC S.L.",
  "nombre_comercial": "ABC Comercial",
  "es_empresa": True,
  "cif": "B11111111",
  "email": "info@abc.com",
  "telefono": "+34 91 111 11 11",
  "movil": "+34 666 111 111",
  "website": "https://www.abc.com",
  "direccion": "Calle Principal, 1",
  "poblacion": "Madrid",
  "codigo_postal": "28001",
  "provincia": "Madrid",
  "pais": "España",
  "identificacion_vat": "ES11111111",
  "tags": "mayorista, distribución, B2B"
}
```

**Script Post-Response:**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("cliente_id", response.id);
    console.log("✅ Cliente creado con ID:", response.id);
}
```

**Resultado Esperado**: Cliente creado automáticamente asociado a TecnoSoluciones.

---

#### **Test 6: 💰 Crear Presupuesto con Items**

```http
POST {{base_url}}/api/sales/presupuestos/
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "numero": "PRES-TEST-001",
  "cliente": {{cliente_id}},
  "items": [
    {
      "articulo": 1,
      "cantidad": 2,
      "precio_unitario": 1200.00,
      "iva_porcentaje": 21.0
    },
    {
      "articulo": 2, 
      "cantidad": 1,
      "precio_unitario": 800.00,
      "iva_porcentaje": 21.0
    }
  ]
}
```

**Script Post-Response:**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("presupuesto_id", response.id);
    console.log("✅ Presupuesto creado con ID:", response.id);
    console.log("Total:", response.total);
}
```

**Resultado Esperado**: Presupuesto con cálculos automáticos de IVA y totales.

---

#### **Test 7: 📄 Generar PDF del Presupuesto**

```http
GET {{base_url}}/api/sales/presupuestos/{{presupuesto_id}}/ver_pdf/
Authorization: Bearer {{access_token}}
```

**Resultado Esperado**: PDF profesional del presupuesto que se abre en navegador.

---

#### **Test 8: 🔄 Convertir Presupuesto a Factura**

```http
POST {{base_url}}/api/sales/presupuestos/{{presupuesto_id}}/convertir_a_factura/
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "numero_factura": "FAC-TEST-001"
}
```

**Script Post-Response:**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("factura_id", response.id);
    console.log("✅ Factura creada con ID:", response.id);
    console.log("Número:", response.numero);
}
```

**Resultado Esperado**: Nueva factura creada con los mismos items del presupuesto.

---

#### **Test 9: 🔐 Test de Aislamiento Multi-Tenant**

**Paso 1**: Login como admin de otra empresa:
```http
POST {{base_url}}/api/auth/login/
Content-Type: application/json

{
  "username": "admin_lopez",
  "password": "lopez123"
}
```

**Paso 2**: Intentar acceder al presupuesto de TecnoSoluciones:
```http
GET {{base_url}}/api/sales/presupuestos/{{presupuesto_id}}/
Authorization: Bearer {{access_token}}
```

**Resultado Esperado**: Error 404 (Not Found) porque el presupuesto pertenece a otra empresa.

---

### **📊 Reportes y Estadísticas**

#### **Test Bonus: Reportes de Ventas**

```http
GET {{base_url}}/api/reportes/ventas_resumen/?fecha_desde=2024-01-01&fecha_hasta=2024-12-31
Authorization: Bearer {{access_token}}
```

**Resultado Esperado**: Resumen de ventas filtrado automáticamente por la empresa del usuario.

---

#### **Test 10: 🏪 TPV - Gestión de Sesiones de Caja**

**Paso 1: Abrir Nueva Sesión de Caja**
```http
POST {{base_url}}/api/pos/sesiones/abrir_nueva/
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "nombre": "Sesión Mañana",
  "saldo_inicial": 100.00,
  "observaciones": "Apertura de turno de mañana"
}
```

**Paso 2: Crear Movimiento de Venta**
```http
POST {{base_url}}/api/pos/movimientos/
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "tipo": "venta",
  "concepto": "Venta de producto",
  "importe": 25.50,
  "metodo_pago": "efectivo",
  "observaciones": "Venta de iPhone 15"
}
```

**Paso 3: Obtener Resumen de Sesión Activa**
```http
GET {{base_url}}/api/pos/sesiones/activa/
Authorization: Bearer {{access_token}}
```

**Paso 4: Cerrar Sesión con Cuadre Automático**
```http
POST {{base_url}}/api/pos/sesiones/{session_id}/cerrar_caja/
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "efectivo_contado": 125.50,
  "observaciones": "Cierre de turno"
}
```

**Resultado Esperado**: Sesión cerrada automáticamente con cuadre calculado y diferencia mostrada.

### **🔍 Validaciones de Seguridad**

#### **Test de Seguridad 1: Token Expirado**
1. Esperar que expire el token (24 horas) o usar token inválido
2. Intentar cualquier endpoint
3. **Resultado Esperado**: Error 401 (Unauthorized)

#### **Test de Seguridad 2: Acceso Sin Token**
1. Intentar cualquier endpoint sin header Authorization
2. **Resultado Esperado**: Error 401 (Unauthorized)

#### **Test de Seguridad 3: Permisos de Rol**
1. Login como usuario básico (ventas_678)
2. Intentar crear otro usuario
3. **Resultado Esperado**: Error 403 (Forbidden)

---

### **🎯 Casos de Uso Completos**

#### **Flujo Comercial Completo**:
1. ✅ Login como admin_tecno
2. ✅ Crear cliente 
3. ✅ Crear presupuesto
4. ✅ Generar PDF del presupuesto
5. ✅ Convertir a pedido
6. ✅ Convertir pedido a albarán
7. ✅ Convertir albarán a factura
8. ✅ Generar PDF de factura final

#### **Validación Multi-Tenancy**:
1. ✅ Login como admin_tecno (empresa 1)
2. ✅ Crear datos de prueba
3. ✅ Login como admin_lopez (empresa 2) 
4. ✅ Verificar que NO puede ver datos de empresa 1
5. ✅ Crear datos propios de empresa 2
6. ✅ Login como superadmin
7. ✅ Verificar que VE datos de ambas empresas

---

### **⚙️ Scripts de Automatización**

#### **Pre-request Script Global** (Nivel de Colección):
```javascript
// Auto-refresh token si está próximo a expirar
const token = pm.environment.get("access_token");
if (!token) {
    console.log("⚠️ No hay token - hacer login primero");
}
```

#### **Test Script Global** (Nivel de Colección):
```javascript
// Verificar respuestas exitosas
pm.test("Status code is success", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 204]);
});

// Log automático de errores
if (pm.response.code >= 400) {
    console.log("❌ Error:", pm.response.code, pm.response.text());
}
```

---

## 🚀 Próximos Pasos de Desarrollo

### **Funcionalidades Planificadas**
- 🎨 **Personalización de la empresa**: Permitir subir colores, logo, etc.
- 📊 **Sistema de contabilidad básica**: Sistema de contabilidad básica con libros diarios, libros mayor, etc.
- 🔐 **2FA**: Autenticación de dos factores
- 📊 **Exportación de docuemntos a Excel/CSV/XLSX**: Capacidad de exportar articulos, clientes, proveedores... a Excel/CSV/XLSX
- 📊 **Importación de docuemntos desde Excel/CSV/XLSX**: Capacidad de importar articulos, clientes, proveedores... desde Excel/CSV/XLSX
- 📊 **Capacidad de analizar un pdf de factura y extraer los datos relevantes**: Poder analizar un pdf de factura y extraer los datos relevantes para crear una factura de compra en el sistema
- 🔐 **Envio a Verifactu**: Capacidad de enviar una factura a Verifactu para su validación.
- 📧 **Envio de email de las ventas**: Envio de email de las ventas a los clientes.
- 📄 **Plantillas de PDFs**: Poder elegir plantillas de PDFs para los documentos generados.
- 📅 **Prueba gratis de 30 dias**: Prueba gratis de 30 dias para evaluar la funcionalidad del sistema y atraer leads.
- 📅 **Suscripciones mensuales**: Suscripciones mensuales con descuento anual.
- 📅 **Suscripciones anuales**: Suscripciones anuales.
- 📅 **Suscripciones empresariales**: Suscripciones empresariales.

### **Mejoras Técnicas**
- 🔍 **Elasticsearch**: Búsqueda avanzada de documentos
- 📊 **Monitoring**: Prometheus + Grafana
- 🧪 **Test Coverage**: 100% cobertura de pruebas

---
