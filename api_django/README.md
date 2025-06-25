# 🏢 Sistema de Gestión Empresarial Multi-Tenant con JWT

## 🚀 Características Principales

- ✅ **Multi-Tenancy**: Aislamiento completo de datos por empresa
- ✅ **Autenticación JWT**: Tokens seguros con refresh automático  
- ✅ **Arquitectura Modular**: 6 apps Django especializadas
- ✅ **Roles y Permisos**: SuperAdmin, EmpresaAdmin, Usuario
- ✅ **Dockerizado**: Despliegue simple con Docker Compose
- ✅ **Base de Datos**: MySQL 8.0 con phpMyAdmin
- ✅ **API REST**: Endpoints completos con Django REST Framework
- ✅ **Generación PDF**: Facturas, presupuestos, albaranes y tickets

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
├── Crear/editar usuarios de su empresa
└── Acceso a todos los módulos de su empresa

Usuario (ventas_678, almacen_678, etc.)
├── Acceso limitado a SU empresa
├── Permisos específicos por rol
└── Solo datos de su empresa
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

## 🐳 Instalación y Despliegue

### **Prerequisitos**
- Docker y Docker Compose
- Puerto 8000 (API), 3306 (MySQL), 8080 (phpMyAdmin) libres

### **Comandos de Inicio**
```bash
# Clonar el repositorio
git clone <repo-url>
cd MiniGestion

# Iniciar servicios
docker-compose up --build

# La API estará disponible en:
# API: http://localhost:8000
# phpMyAdmin: http://localhost:8080
```

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

La API está organizada en **6 apps Django** con aislamiento de tenants:

### **`accounts/`** - Autenticación y Multi-Tenancy
- **CustomUser**: Usuario con empresa y roles
- **Empresa**: Modelo central de tenant
- **JWT Views**: Login, refresh, verify, me

### **`tenants/`** - Middleware y Utilidades  
- **TenantMiddleware**: Filtrado automático por empresa
- **ThreadLocalMiddleware**: Contexto de request
- **Permissions**: Control de acceso por roles

### **`core/`** - Modelos Base
- **Cliente**: Clientes por empresa
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

### **📞 Contactos** (EmpresaAdmin y Usuario)
```http
GET    /api/core/contactos/         # Listar contactos (agrupación de clientes y proveedores)
```

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
  "nombre": "María",
  "apellido": "González",
  "email": "maria@ejemplo.com",
  "telefono": "666777888",
  "direccion": "Av. Libertad 456",
  "ciudad": "Barcelona",
  "codigo_postal": "08001",
  "pais": "España"
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
- 📱 **Frontend React**: Interfaz completa multi-tenant
- 🔔 **Notificaciones**: Sistema de alertas por empresa
- 📈 **Dashboard Analytics**: Métricas y KPIs por tenant(empresa)
- 🔄 **Backup Automático**: Respaldos programados por empresa
- 🌐 **Multi-idioma**: Soporte i18n para diferentes regiones
- 🔐 **2FA**: Autenticación de dos factores
- 📧 **Email Integration**: Envío automático de PDFs
- 📊 **Exportación de docuemntos a Excel/CSV/XLSX**: Capacidad de exportar articulos, persupuestos... a Excel/CSV/XLSX
- 📊 **Importación de docuemntos desde Excel/CSV/XLSX**: Capacidad de importar articulos, persupuestos... desde Excel/CSV/XLSX
- 📊 **Capacidad de analizar un pdf de factura y extraer los datos relevantes**: Poder analizar un pdf de factura y extraer los datos relevantes para crear una factura de compra en el sistema
- 🔐 **Envio a Verifactu**: Capacidad de enviar una factura a Verifactu para su validación.


### **Mejoras Técnicas**
- 🔍 **Elasticsearch**: Búsqueda avanzada de documentos
- 📊 **Monitoring**: Prometheus + Grafana
- 🧪 **Test Coverage**: 100% cobertura de pruebas
- 📚 **Documentación completa de la API**: Falta poner OpenAPI

---
