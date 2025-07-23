import os
import django
import sys
from decimal import Decimal
from django.db import transaction
from django.test import RequestFactory
from tenants.middleware import ThreadLocalMiddleware

# Configurar Django
env_key = 'DJANGO_SETTINGS_MODULE'
if env_key not in os.environ:
    os.environ.setdefault(env_key, 'gestion_empresa.settings')
django.setup()

# Crear request mock para el contexto de tenants
factory = RequestFactory()
mock_request = factory.get('/')
thread_local_middleware = ThreadLocalMiddleware(lambda r: None)
thread_local_middleware.process_request(mock_request)

# Importaciones modulares
from accounts.models import Empresa, CustomUser
from core.models import Cliente, Proveedor, Serie
from products.models import Categoria, Marca, Articulo
from sales.models import (
    Presupuesto, PresupuestoItem, Pedido, PedidoItem, 
    Albaran, AlbaranItem, Ticket, TicketItem, Factura
)
from hr.models import Departamento, Empleado
from projects.models import Proyecto
from pos.models import CajaSession, MovimientoCaja, CuadreCaja
from inventory.models import Almacen, ArticuloStock, MovimientoStock
from django.utils import timezone
from datetime import date, timedelta


def create_superuser_and_empresas():
    """Crear superusuario y empresas de ejemplo"""
    print("Creando superusuario y empresas...")
    
    # Crear superusuario
    if not CustomUser.objects.filter(is_superuser=True).exists():
        superuser = CustomUser.objects.create_superuser(
            username='admin',
            email='admin@minigestion.com',
            password='admin123',
            first_name='Super',
            last_name='Admin',
            role='superadmin'
        )
        print(f"✓ Superusuario creado: {superuser.username}")
    
    # Crear empresas de ejemplo
    empresas_data = [
        {
            'nombre': 'TecnoSoluciones S.L.',
            'cif': 'B12345678',
            'direccion': 'Calle Tecnología, 123, 28001 Madrid',
            'telefono': '+34 91 123 45 67',
            'email': 'info@tecnosoluciones.com',
            'web': 'https://www.tecnosoluciones.com',
            'plan': 'premium',
            'max_usuarios': 25,
            'admin_data': {
                'username': 'admin_tecno',
                'email': 'admin@tecnosoluciones.com',
                'password': 'tecno123',
                'first_name': 'Carlos',
                'last_name': 'García'
            }
        },
        {
            'nombre': 'Comercial López e Hijos S.A.',
            'cif': 'A87654321',
            'direccion': 'Avenida Comercio, 456, 08001 Barcelona',
            'telefono': '+34 93 987 65 43',
            'email': 'contacto@lopezehijos.com',
            'web': 'https://www.lopezehijos.com',
            'plan': 'basico',
            'max_usuarios': 5,
            'admin_data': {
                'username': 'admin_lopez',
                'email': 'admin@lopezehijos.com',
                'password': 'lopez123',
                'first_name': 'María',
                'last_name': 'López'
            }
        }
    ]
    
    empresas_created = {}
    
    for empresa_data in empresas_data:
        admin_data = empresa_data.pop('admin_data')
        
        empresa, created = Empresa.objects.get_or_create(
            cif=empresa_data['cif'],
            defaults=empresa_data
        )
        
        if created:
            print(f"✓ Empresa creada: {empresa.nombre}")
            
            # Crear usuario administrador de la empresa
            admin_user = CustomUser.objects.create_user(
                username=admin_data['username'],
                email=admin_data['email'],
                password=admin_data['password'],
                first_name=admin_data['first_name'],
                last_name=admin_data['last_name'],
                empresa=empresa,
                role='admin',
                can_manage_users=True,
                can_manage_settings=True,
                can_view_reports=True
            )
            print(f"✓ Admin de empresa creado: {admin_user.username}")
            
            # Crear algunos usuarios de ejemplo para cada empresa
            usuarios_data = [
                {
                    'username': f'ventas_{empresa.cif[-3:].lower()}',
                    'email': f'ventas@{empresa.email.split("@")[1]}',
                    'password': 'ventas123',
                    'first_name': 'Ana',
                    'last_name': 'Martín',
                    'role': 'employee',
                    'cargo': 'Vendedora',
                    'can_view_reports': True
                },
                {
                    'username': f'almacen_{empresa.cif[-3:].lower()}',
                    'email': f'almacen@{empresa.email.split("@")[1]}',
                    'password': 'almacen123',
                    'first_name': 'Pedro',
                    'last_name': 'Ruiz',
                    'role': 'employee',
                    'cargo': 'Encargado de Almacén'
                }
            ]
            
            for user_data in usuarios_data:
                if empresa.can_add_user():
                    user = CustomUser.objects.create_user(
                        empresa=empresa,
                        **user_data
                    )
                    print(f"✓ Usuario creado: {user.username}")
                    
                    # Los empleados se crean automáticamente via signals
                    # cuando se crea un CustomUser con role='employee'
                    pass
        
        empresas_created[empresa.cif] = empresa
    
    return empresas_created


def create_sample_data_for_empresa(empresa):
    """Crear datos de ejemplo para una empresa específica"""
    print(f"\nCreando datos de ejemplo para {empresa.nombre}...")
    
    # Establecer la empresa actual en el contexto del thread
    from tenants.middleware import set_current_tenant
    set_current_tenant(empresa)
    
    try:
        # Obtener el usuario administrador de la empresa
        admin_user = CustomUser.objects.filter(empresa=empresa, role='admin').first()
        if not admin_user:
            # Si no se encuentra, usar el primer usuario disponible
            admin_user = CustomUser.objects.filter(empresa=empresa).first()
        
        # Crear marcas
        print("Creando marcas...")
        marcas_data = [
            ('Samsung', 'Empresa coreana de electrónicos', 'Corea del Sur'),
            ('Apple', 'Empresa americana de tecnología', 'Estados Unidos'),
            ('Sony', 'Empresa japonesa de electrónicos', 'Japón'),
            ('IKEA', 'Empresa sueca de muebles', 'Suecia'),
            ('HP', 'Empresa americana de computadoras', 'Estados Unidos'),
        ]
        
        marcas_objs = {}
        for nombre, descripcion, pais in marcas_data:
            marca, created = Marca.objects.get_or_create(
                nombre=nombre,
                empresa=empresa,
                defaults={
                    'descripcion': descripcion,
                    'pais_origen': pais,
                }
            )
            marcas_objs[nombre] = marca
            if created:
                print(f"✓ Marca: {nombre}")
        
        # Crear categorías
        print("Creando categorías...")
        categorias_data = [
            ('Electrónicos', 'Dispositivos electrónicos y tecnología'),
            ('Muebles', 'Muebles para hogar y oficina'),
            ('Deportes', 'Artículos deportivos y fitness'),
            ('Papelería', 'Material de oficina y papelería'),
            ('Ropa', 'Prendas de vestir y accesorios'),
        ]
        
        categorias_objs = {}
        for nombre, descripcion in categorias_data:
            categoria, created = Categoria.objects.get_or_create(
                nombre=nombre,
                empresa=empresa,
                defaults={
                    'descripcion': descripcion,
                }
            )
            categorias_objs[nombre] = categoria
            if created:
                print(f"✓ Categoría: {nombre}")
        
        # Crear artículos
        print("Creando artículos...")
        articulos_data = [
            ('iPhone 15 Pro', 'Smartphone Apple iPhone 15 Pro 128GB', 'Electrónicos', 'Apple', 999.99, 50),
            ('Galaxy S24', 'Samsung Galaxy S24 256GB', 'Electrónicos', 'Samsung', 849.99, 30),
            ('MacBook Air M2', 'Portátil Apple MacBook Air con chip M2', 'Electrónicos', 'Apple', 1199.99, 15),
            ('Escritorio BEKANT', 'Mesa de escritorio IKEA BEKANT 160x80cm', 'Muebles', 'IKEA', 129.99, 25),
            ('Silla MARKUS', 'Silla de oficina IKEA MARKUS ergonómica', 'Muebles', 'IKEA', 199.99, 20),
        ]
        
        for nombre, descripcion, cat_nombre, marca_nombre, precio, stock in articulos_data:
            articulo, created = Articulo.objects.get_or_create(
                nombre=nombre,
                empresa=empresa,
                defaults={
                    'descripcion': descripcion,
                    'categoria': categorias_objs[cat_nombre],
                    'marca': marcas_objs[marca_nombre],
                    'precio': precio,
                    'stock': stock,
                }
            )
            if created:
                print(f"✓ Artículo: {nombre}")
        
        # Crear clientes
        print("Creando clientes...")
        clientes_data = [
            {
                'nombre': 'Empresa ABC S.L.',
                'nombre_comercial': 'ABC Comercial',
                'es_empresa': True,
                'cif': 'B11111111',
                'email': 'info@abc.com',
                'telefono': '+34 91 111 11 11',
                'movil': '+34 666 111 111',
                'website': 'https://www.abc.com',
                'direccion': 'Calle Principal, 1',
                'poblacion': 'Madrid',
                'codigo_postal': '28001',
                'provincia': 'Madrid',
                'pais': 'España',
                'identificacion_vat': 'ES11111111',
                'tags': 'mayorista, distribución, B2B'
            },
            {
                'nombre': 'Empresa2 ABC S.L.',
                'nombre_comercial': 'ABC 2 Comercial',
                'es_empresa': True,
                'cif': 'B22222222',
                'email': 'info@abc2.com',
                'telefono': '+34 91 222 22 22',
                'movil': '+34 666 222 222',
                'website': 'https://www.abc2.com',
                'direccion': 'Calle Principal, 2',
                'poblacion': 'Madrid',
                'codigo_postal': '28001',
                'provincia': 'Madrid',
                'pais': 'España',
                'identificacion_vat': 'ES22222222',
                'tags': 'mayorista, distribución, B2B'
            },
            {
                'nombre': 'Empresa3 ABC S.L.',
                'nombre_comercial': 'ABC 3 Comercial',
                'es_empresa': True,
                'cif': 'B33333333',
                'email': 'info@abc3.com',
                'telefono': '+34 91 333 33 33',
                'movil': '+34 666 333 333',
                'website': 'https://www.abc3.com',
                'direccion': 'Calle Principal, 3',
                'poblacion': 'Madrid',
                'codigo_postal': '28001',
                'provincia': 'Madrid',
                'pais': 'España',
                'identificacion_vat': 'ES11111111',
                'tags': 'mayorista, distribución, B2B'
            },
            {
                'nombre': 'Empresa4 ABC S.L.',
                'nombre_comercial': 'ABC 4 Comercial',
                'es_empresa': True,
                'cif': 'B44444444',
                'email': 'info@abc4.com',
                'telefono': '+34 91 444 44 44',
                'movil': '+34 666 444 444',
                'website': 'https://www.abc4.com',
                'direccion': 'Calle Principal, 4',
                'poblacion': 'Madrid',
                'codigo_postal': '28001',
                'provincia': 'Madrid',
                'pais': 'España',
                'identificacion_vat': 'ES44444444',
                'tags': 'mayorista, distribución, B2B'
            },
            {
                'nombre': 'Empresa ABC S.L.',
                'nombre_comercial': 'ABC Comercial',
                'es_empresa': True,
                'cif': 'B55555555',
                'email': 'info@abc5.com',
                'telefono': '+34 91 555 55 55',
                'movil': '+34 666 555 555',
                'website': 'https://www.abc5.com',
                'direccion': 'Calle Principal, 5',
                'poblacion': 'Madrid',
                'codigo_postal': '28001',
                'provincia': 'Madrid',
                'pais': 'España',
                'identificacion_vat': 'ES55555555',
                'tags': 'mayorista, distribución, B2B'
            },
            {
                'nombre': 'Empresa ABC S.L.',
                'nombre_comercial': 'ABC Comercial',
                'es_empresa': True,
                'cif': 'B66666666',
                'email': 'info@abc6.com',
                'telefono': '+34 91 666 66 66',
                'movil': '+34 666 666 666',
                'website': 'https://www.abc6.com',
                'direccion': 'Calle Principal, 6',
                'poblacion': 'Madrid',
                'codigo_postal': '28001',
                'provincia': 'Madrid',
                'pais': 'España',
                'identificacion_vat': 'ES66666666',
                'tags': 'mayorista, distribución, B2B'
            },
            {
                'nombre': 'Empresa7 ABC S.L.',
                'nombre_comercial': 'ABC Comercial',
                'es_empresa': True,
                'cif': 'B77777777',
                'email': 'info@abc7.com',
                'telefono': '+34 91 777 77 77',
                'movil': '+34 666 666 666',
                'website': 'https://www.abc7.com',
                'direccion': 'Calle Principal, 6',
                'poblacion': 'Madrid',
                'codigo_postal': '28001',
                'provincia': 'Madrid',
                'pais': 'España',
                'identificacion_vat': 'ES77777777',
                'tags': 'mayorista, distribución, B2B'
            },
            {
                'nombre': 'Empresa8 ABC S.L.',
                'nombre_comercial': 'ABC Comercial',
                'es_empresa': True,
                'cif': 'B88888888',
                'email': 'info@abc8.com',
                'telefono': '+34 91 888 88 88',
                'movil': '+34 666 666 666',
                'website': 'https://www.abc6.com',
                'direccion': 'Calle Principal, 6',
                'poblacion': 'Madrid',
                'codigo_postal': '28001',
                'provincia': 'Madrid',
                'pais': 'España',
                'identificacion_vat': 'ES88888888',
                'tags': 'mayorista, distribución, B2B'
            },
            {
                'nombre': 'Empresa9 ABC S.L.',
                'nombre_comercial': 'ABC Comercial',
                'es_empresa': True,
                'cif': 'B99999999',
                'email': 'info@abc9.com',
                'telefono': '+34 91 999 99 99',
                'movil': '+34 666 666 666',
                'website': 'https://www.abc6.com',
                'direccion': 'Calle Principal, 6',
                'poblacion': 'Madrid',
                'codigo_postal': '28001',
                'provincia': 'Madrid',
                'pais': 'España',
                'identificacion_vat': 'ES99999999',
                'tags': 'mayorista, distribución, B2B'
            },
            {
                'nombre': 'Empresa10 ABC S.L.',
                'nombre_comercial': 'ABC Comercial',
                'es_empresa': True,
                'cif': 'B10101010',
                'email': 'info@abc10.com',
                'telefono': '+34 91 101 10 10',
                'movil': '+34 666 666 666',
                'website': 'https://www.abc10.com',
                'direccion': 'Calle Principal, 6',
                'poblacion': 'Madrid',
                'codigo_postal': '28001',
                'provincia': 'Madrid',
                'pais': 'España',
                'identificacion_vat': 'ES10101010',
                'tags': 'mayorista, distribución, B2B'
            },
            {
                'nombre': 'Empresa11 ABC S.L.',
                'nombre_comercial': 'ABC Comercial',
                'es_empresa': True,
                'cif': 'B11111111',
                'email': 'info@abc11.com',
                'telefono': '+34 91 111 11 11',
                'movil': '+34 666 666 666',
                'website': 'https://www.abc6.com',
                'direccion': 'Calle Principal, 6',
                'poblacion': 'Madrid',
                'codigo_postal': '28001',
                'provincia': 'Madrid',
                'pais': 'España',
                'identificacion_vat': 'ES11111111',
                'tags': 'mayorista, distribución, B2B'
            },
            {
                'nombre': 'Empresa12 ABC S.L.',
                'nombre_comercial': 'ABC Comercial',
                'es_empresa': True,
                'cif': 'B12121212',
                'email': 'info@abc12.com',
                'telefono': '+34 91 121 12 12',
                'movil': '+34 666 666 666',
                'website': 'https://www.abc6.com',
                'direccion': 'Calle Principal, 6',
                'poblacion': 'Madrid',
                'codigo_postal': '28001',
                'provincia': 'Madrid',
                'pais': 'España',
                'identificacion_vat': 'ES12121212',
                'tags': 'mayorista, distribución, B2B'
            },
            {
                'nombre': 'Empresa13 ABC S.L.',
                'nombre_comercial': 'ABC Comercial',
                'es_empresa': True,
                'cif': 'B13131313',
                'email': 'info@abc13.com',
                'telefono': '+34 91 131 13 13',
                'movil': '+34 666 666 666',
                'website': 'https://www.abc6.com',
                'direccion': 'Calle Principal, 6',
                'poblacion': 'Madrid',
                'codigo_postal': '28001',
                'provincia': 'Madrid',
                'pais': 'España',
                'identificacion_vat': 'ES13131313',
                'tags': 'mayorista, distribución, B2B'
            },
            {
                'nombre': 'Empresa14 ABC S.L.',
                'nombre_comercial': 'ABC Comercial',
                'es_empresa': True,
                'cif': 'B14141414',
                'email': 'info@abc14.com',
                'telefono': '+34 91 141 14 14',
                'movil': '+34 666 666 666',
                'website': 'https://www.abc6.com',
                'direccion': 'Calle Principal, 6',
                'poblacion': 'Madrid',
                'codigo_postal': '28001',
                'provincia': 'Madrid',
                'pais': 'España',
                'identificacion_vat': 'ES14141414',
                'tags': 'mayorista, distribución, B2B'
            },
            {
                'nombre': 'Distribuciones XYZ',
                'nombre_comercial': 'XYZ Distribución',
                'es_empresa': True,
                'cif': 'B22222222',
                'email': 'contacto@xyz.com',
                'telefono': '+34 93 222 22 22',
                'movil': '+34 666 222 222',
                'website': 'https://www.xyz.com',
                'direccion': 'Avenida Central, 25',
                'poblacion': 'Barcelona',
                'codigo_postal': '08001',
                'provincia': 'Barcelona',
                'pais': 'España',
                'identificacion_vat': 'ES22222222',
                'tags': 'minorista, comercio, retail'
            },
            {
                'nombre': 'Juan García Pérez',
                'nombre_comercial': 'Comercial 123',
                'es_empresa': False,
                'cif': '12345678Z',
                'email': 'juan@comercial123.com',
                'telefono': '+34 95 333 33 33',
                'movil': '+34 666 333 333',
                'website': 'https://www.comercial123.com',
                'direccion': 'Plaza Mayor, 10',
                'poblacion': 'Sevilla',
                'codigo_postal': '41001',
                'provincia': 'Sevilla',
                'pais': 'España',
                'identificacion_vat': '',
                'tags': 'autónomo, pequeño comercio'
            },
        ]
        
        for data in clientes_data:
            cliente, created = Cliente.objects.get_or_create(
                cif=data['cif'],
                empresa=empresa,
                defaults=data
            )
            if created:
                print(f"✓ Cliente: {data['nombre']}")
        
        # Crear proveedores
        print("Creando proveedores...")
        proveedores_data = [
            {
                'nombre': 'Suministros Industriales S.A.',
                'nombre_comercial': 'Industrial Supply',
                'es_empresa': True,
                'cif_nif': 'A44444444',
                'email': 'ventas@suministros.com',
                'telefono': '+34 91 444 44 44',
                'movil': '+34 666 444 444',
                'website': 'https://www.suministros.com',
                'direccion': 'Polígono Industrial Norte, Nave 15',
                'poblacion': 'Getafe',
                'codigo_postal': '28902',
                'provincia': 'Madrid',
                'pais': 'España',
                'identificacion_vat': 'ES44444444',
                'tags': 'industrial, maquinaria, B2B'
            },
            {
                'nombre': 'Materiales y Equipos López',
                'nombre_comercial': 'López Materiales',
                'es_empresa': True,
                'cif_nif': 'B55555555',
                'email': 'info@lopez-materiales.com',
                'telefono': '+34 93 555 55 55',
                'movil': '+34 666 555 555',
                'website': 'https://www.lopez-materiales.com',
                'direccion': 'Calle de los Proveedores, 30',
                'poblacion': 'Sabadell',
                'codigo_postal': '08201',
                'provincia': 'Barcelona',
                'pais': 'España',
                'identificacion_vat': 'ES55555555',
                'tags': 'construcción, materiales, obra'
            },
            {
                'nombre': 'Tecnología Avanzada S.L.',
                'nombre_comercial': 'TechAdvanced',
                'es_empresa': True,
                'cif_nif': 'B66666666',
                'email': 'contacto@tecnoavanzada.com',
                'telefono': '+34 95 666 66 66',
                'movil': '+34 666 666 666',
                'website': 'https://www.tecnoavanzada.com',
                'direccion': 'Parque Tecnológico, Edificio A',
                'poblacion': 'Málaga',
                'codigo_postal': '29590',
                'provincia': 'Málaga',
                'pais': 'España',
                'identificacion_vat': 'ES66666666',
                'tags': 'tecnología, software, hardware'
            },
            {
                'nombre': 'Ana Martínez Ruiz',
                'nombre_comercial': 'Papelería Martínez',
                'es_empresa': False,
                'cif_nif': '87654321A',
                'email': 'ana@papeleria-martinez.com',
                'telefono': '+34 91 777 77 77',
                'movil': '+34 666 777 777',
                'website': 'https://www.papeleria-martinez.com',
                'direccion': 'Avenida de las Flores, 12',
                'poblacion': 'Alcalá de Henares',
                'codigo_postal': '28801',
                'provincia': 'Madrid',
                'pais': 'España',
                'identificacion_vat': '',
                'tags': 'papelería, autónoma, oficina'
            },
            {
                'nombre': 'Distribuciones del Norte S.A.',
                'nombre_comercial': 'DistriNorte',
                'es_empresa': True,
                'cif_nif': 'A88888888',
                'email': 'comercial@distrinorte.com',
                'telefono': '+34 98 888 88 88',
                'movil': '+34 666 888 888',
                'website': 'https://www.distrinorte.com',
                'direccion': 'Zona Industrial Este, Parcela 8',
                'poblacion': 'Bilbao',
                'codigo_postal': '48001',
                'provincia': 'Vizcaya',
                'pais': 'España',
                'identificacion_vat': 'ES88888888',
                'tags': 'distribución, logística, almacén'
            },
        ]
        
        for data in proveedores_data:
            proveedor, created = Proveedor.objects.get_or_create(
                cif_nif=data['cif_nif'],
                empresa=empresa,
                defaults=data
            )
            if created:
                print(f"✓ Proveedor: {data['nombre']}")
        
        # Crear departamentos
        print("Creando departamentos...")
        departamentos_data = [
            ('Ventas', 'Departamento de ventas y atención al cliente'),
            ('Almacén', 'Gestión de inventario y logística'),
            ('Administración', 'Contabilidad y administración'),
            ('IT', 'Tecnologías de la información'),
            ('Marketing', 'Departamento de marketing y publicidad'),
            ('Recursos Humanos', 'Gestión de personal y recursos'),
            ('Finanzas', 'Departamento de finanzas y contabilidad'),
            ('Producción', 'Gestión de producción y fabricación'),
            ('Logística', 'Departamento de logística y distribución'),
            ('Compras', 'Departamento de compras y suministros'),
        ]
        
        for nombre, descripcion in departamentos_data:
            departamento, created = Departamento.objects.get_or_create(
                nombre=nombre,
                empresa=empresa,
                defaults={
                    'descripcion': descripcion,
                }
            )
            if created:
                print(f"✓ Departamento: {nombre}")
        
        # Asignar departamentos a empleados creados automáticamente
        print("Asignando departamentos a empleados...")
        try:
            from hr.models import Empleado
            empleados = Empleado.objects.filter(empresa=empresa, departamento__isnull=True)
            
            for empleado in empleados:
                departamento = None
                username = empleado.usuario.username
                
                # Asignar departamento según el username
                if 'ventas' in username:
                    departamento = Departamento.objects.filter(empresa=empresa, nombre='Ventas').first()
                elif 'almacen' in username:
                    departamento = Departamento.objects.filter(empresa=empresa, nombre='Almacén').first()
                elif 'admin' in username:
                    departamento = Departamento.objects.filter(empresa=empresa, nombre='Administración').first()
                elif 'it' in username or 'desarrollo' in empleado.puesto.lower():
                    departamento = Departamento.objects.filter(empresa=empresa, nombre='IT').first()
                
                if departamento:
                    empleado.departamento = departamento
                    empleado.save()
                    print(f"✓ Departamento asignado: {empleado.usuario.get_full_name()} → {departamento.nombre}")
        except Exception as e:
            print(f"⚠️  Error asignando departamentos: {e}")
        
        # ==== Crear datos de TPV ====
        print("Creando datos de TPV...")
        
        # Obtener usuarios de ventas para las sesiones de caja
        usuarios_ventas = CustomUser.objects.filter(
            empresa=empresa,
            username__icontains='ventas'
        )
        
        if usuarios_ventas.exists():
            usuario_ventas = usuarios_ventas.first()
            
            # Crear sesión de caja cerrada (histórica)
            sesion_historica = CajaSession.objects.create(
                usuario=usuario_ventas,
                nombre=f"Caja Principal {empresa.nombre[:10]} - {timezone.now().strftime('%d/%m')}",
                estado='cerrada',
                fecha_apertura=timezone.now() - timedelta(days=1),
                fecha_cierre=timezone.now() - timedelta(hours=8),
                saldo_inicial=Decimal('100.00'),
                saldo_final=Decimal('485.50'),
                notas_apertura="Apertura normal de caja",
                notas_cierre="Cierre con cuadre correcto",
                empresa=empresa
            )
            
            # Crear movimientos para la sesión histórica
            movimientos_historicos = [
                {
                    'tipo': 'venta',
                    'importe': Decimal('25.50'),
                    'metodo_pago': 'efectivo',
                    'concepto': 'Venta #001 - Productos varios'
                },
                {
                    'tipo': 'venta', 
                    'importe': Decimal('45.80'),
                    'metodo_pago': 'tarjeta',
                    'concepto': 'Venta #002 - Servicio técnico'
                },
                {
                    'tipo': 'entrada',
                    'importe': Decimal('50.00'),
                    'metodo_pago': 'efectivo', 
                    'concepto': 'Entrada de efectivo inicial'
                },
                {
                    'tipo': 'venta',
                    'importe': Decimal('125.00'),
                    'metodo_pago': 'mixto',
                    'importe_efectivo': Decimal('75.00'),
                    'importe_tarjeta': Decimal('50.00'),
                    'concepto': 'Venta #003 - Pago mixto'
                }
            ]
            
            for mov_data in movimientos_historicos:
                MovimientoCaja.objects.create(
                    caja_session=sesion_historica,
                    empresa=empresa,
                    **mov_data
                )
            
            # Crear cuadre para la sesión histórica
            efectivo_esperado = sesion_historica.calcular_efectivo_esperado()
            CuadreCaja.objects.create(
                caja_session=sesion_historica,
                efectivo_contado=Decimal('385.50'),
                efectivo_esperado=efectivo_esperado,
                observaciones="Cuadre correcto, diferencia mínima",
                empresa=empresa
            )
            
            # Crear sesión actual abierta
            sesion_actual = CajaSession.objects.create(
                usuario=usuario_ventas,
                nombre=f"Caja Principal {empresa.nombre[:10]} - {timezone.now().strftime('%d/%m')}",
                estado='abierta',
                fecha_apertura=timezone.now() - timedelta(hours=2),
                saldo_inicial=Decimal('100.00'),
                notas_apertura="Inicio de jornada",
                empresa=empresa
            )
            
            # Crear algunos movimientos para la sesión actual
            MovimientoCaja.objects.create(
                caja_session=sesion_actual,
                tipo='entrada',
                importe=Decimal('100.00'),
                metodo_pago='efectivo',
                concepto='Fondo de caja inicial',
                empresa=empresa
            )
            
            MovimientoCaja.objects.create(
                caja_session=sesion_actual,
                tipo='venta',
                importe=Decimal('18.50'),
                metodo_pago='efectivo',
                concepto='Venta del día - Cliente walk-in',
                empresa=empresa
            )
            
            print(f"✓ Datos de TPV creados: 2 sesiones, movimientos y cuadre")
        
        # 9. Crear datos de inventory (almacenes y stock)
        print("   Creando datos de inventory...")
        
        # Crear almacén principal
        almacen_principal = Almacen.objects.create(
            nombre="Almacén Principal",
            codigo="ALM001",
            direccion="Calle Principal 123, Ciudad",
            telefono="666-123-456",
            responsable="Juan García",
            activo=True,
            es_principal=True,
            empresa=empresa
        )
        
        # Crear almacén secundario
        almacen_tienda = Almacen.objects.create(
            nombre="Tienda Centro",
            codigo="TDA001", 
            direccion="Plaza Mayor 5, Centro",
            telefono="666-789-012",
            responsable="María López",
            activo=True,
            es_principal=False,
            empresa=empresa
        )
        
        # Migrar stock existente de artículos al almacén principal
        articulos = Articulo.objects.filter(empresa=empresa)
        for articulo in articulos:
            if articulo.stock > 0:
                # Crear registro de stock en almacén principal
                articulo_stock = ArticuloStock.objects.create(
                    articulo=articulo,
                    almacen=almacen_principal,
                    stock_actual=articulo.stock,
                    stock_minimo=max(5, articulo.stock // 4),  # 25% del stock actual como mínimo
                    stock_maximo=articulo.stock * 2,  # El doble como máximo
                    pasillo=str((articulo.id % 5) + 1),
                    estanteria=str((articulo.id % 3) + 1),
                    nivel="1",
                    empresa=empresa
                )
                
                # Crear movimiento inicial de entrada
                MovimientoStock.objects.create(
                    articulo=articulo,
                    almacen=almacen_principal,
                    tipo='entrada',
                    motivo='inicial',
                    cantidad=articulo.stock,
                    stock_anterior=0,
                    stock_posterior=articulo.stock,
                    precio_unitario=articulo.precio,
                    observaciones=f'Stock inicial migrado desde artículo #{articulo.id}',
                    usuario=admin_user,
                    empresa=empresa
                )
        
        # Crear algunos stocks en tienda con menos cantidad
        articulos_tienda = articulos[:3]  # Solo los primeros 3 artículos en tienda
        for articulo in articulos_tienda:
            cantidad_tienda = max(1, articulo.stock // 3)  # Un tercio del stock principal
            
            ArticuloStock.objects.create(
                articulo=articulo,
                almacen=almacen_tienda,
                stock_actual=cantidad_tienda,
                stock_minimo=2,
                stock_maximo=cantidad_tienda * 3,
                pasillo="1",
                estanteria=str((articulo.id % 2) + 1),
                nivel="1",
                empresa=empresa
            )
            
            # Crear movimiento de entrada en tienda
            MovimientoStock.objects.create(
                articulo=articulo,
                almacen=almacen_tienda,
                tipo='entrada',
                motivo='inicial',
                cantidad=cantidad_tienda,
                stock_anterior=0,
                stock_posterior=cantidad_tienda,
                precio_unitario=articulo.precio,
                observaciones=f'Stock inicial en tienda para {articulo.nombre}',
                usuario=admin_user,
                empresa=empresa
            )
        
        print(f"✓ Datos de inventory creados: 2 almacenes, stock migrado para {articulos.count()} artículos")
        
        # 10. Crear Series de numeración
        print("   Creando series de numeración...")
        
        # Serie para almacén principal
        serie_principal = Serie.objects.create(
            nombre="SERIE-PRINCIPAL",
            descripcion="Serie principal para el almacén central",
            almacen=almacen_principal,
            activa=True,
            empresa=empresa
        )
        
        # Serie para tienda
        serie_tienda = Serie.objects.create(
            nombre="SERIE-TIENDA",
            descripcion="Serie para la tienda del centro",
            almacen=almacen_tienda,
            activa=True,
            empresa=empresa
        )
        
        print(f"✓ Series creadas: {serie_principal.nombre} y {serie_tienda.nombre}")
        
        print(f"✓ Datos de ejemplo creados para {empresa.nombre}")
        
    finally:
        # Limpiar el contexto del thread
        set_current_tenant(None)


def run():
    """Inserta datos iniciales en la base de datos con multi-tenancy"""
    # Evitar duplicados
    if CustomUser.objects.exists():
        print("Ya existen usuarios en la base de datos. Omitiendo inicialización.")
        return

    try:
        with transaction.atomic():
            print("Iniciando carga de datos iniciales con multi-tenancy...")
            
            # Crear superusuario y empresas
            empresas = create_superuser_and_empresas()
            
            # Crear datos de ejemplo para cada empresa
            for cif, empresa in empresas.items():
                create_sample_data_for_empresa(empresa)
            
            print("\n" + "="*50)
            print("INICIALIZACIÓN COMPLETADA EXITOSAMENTE")
            print("="*50)
            print("\nCredenciales de acceso:")
            print("\n1. SUPERUSUARIO:")
            print("   - Usuario: admin")
            print("   - Contraseña: admin123")
            print("   - Puede gestionar todas las empresas")
            
            print("\n2. EMPRESA: TecnoSoluciones S.L.")
            print("   - Admin: admin_tecno / tecno123")
            print("   - Ventas: ventas_678 / ventas123")
            print("   - Almacén: almacen_678 / almacen123")
            
            print("\n3. EMPRESA: Comercial López e Hijos S.A.")
            print("   - Admin: admin_lopez / lopez123")
            print("   - Ventas: ventas_321 / ventas123")
            print("   - Almacén: almacen_321 / almacen123")
            
            print("\nEndpoints principales:")
            print("   - Login: POST /api/auth/login/")
            print("   - Perfil: GET /api/auth/profile/")
            print("   - Empresas: GET /api/auth/empresas/ (solo superadmin)")
            print("   - Usuarios: GET /api/auth/users/")
            print("   - API Modules: /api/core/, /api/products/, /api/sales/, etc.")
            print("   - TPV/POS: /api/pos/sesiones/, /api/pos/movimientos/, /api/pos/cuadres/")
            
    except Exception as e:
        print(f"Error durante la inicialización: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    run()