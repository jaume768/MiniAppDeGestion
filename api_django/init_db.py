import os
import django
import sys
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
from core.models import Cliente, Proveedor
from products.models import Categoria, Marca, Articulo
from sales.models import (
    Presupuesto, PresupuestoItem, Pedido, PedidoItem, 
    Albaran, AlbaranItem, Ticket, TicketItem, Factura
)
from hr.models import Departamento, Empleado
from projects.models import Proyecto
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
                    'role': 'empleado',
                    'cargo': 'Vendedora',
                    'can_view_reports': True
                },
                {
                    'username': f'almacen_{empresa.cif[-3:].lower()}',
                    'email': f'almacen@{empresa.email.split("@")[1]}',
                    'password': 'almacen123',
                    'first_name': 'Pedro',
                    'last_name': 'Ruiz',
                    'role': 'empleado',
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
        
        empresas_created[empresa.cif] = empresa
    
    return empresas_created


def create_sample_data_for_empresa(empresa):
    """Crear datos de ejemplo para una empresa específica"""
    print(f"\nCreando datos de ejemplo para {empresa.nombre}...")
    
    # Establecer la empresa actual en el contexto del thread
    from tenants.middleware import set_current_tenant
    set_current_tenant(empresa)
    
    try:
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
            ('Empresa ABC S.L.', 'B11111111', 'Calle Principal, 1', '+34 91 111 11 11', 'info@abc.com'),
            ('Distribuciones XYZ', 'B22222222', 'Avenida Central, 25', '+34 93 222 22 22', 'contacto@xyz.com'),
            ('Comercial 123', 'B33333333', 'Plaza Mayor, 10', '+34 95 333 33 33', 'ventas@123.com'),
        ]
        
        for nombre, cif, direccion, telefono, email in clientes_data:
            cliente, created = Cliente.objects.get_or_create(
                cif=cif,
                empresa=empresa,
                defaults={
                    'nombre': nombre,
                    'direccion': direccion,
                    'telefono': telefono,
                    'email': email,
                }
            )
            if created:
                print(f"✓ Cliente: {nombre}")
        
        # Crear proveedores
        print("Creando proveedores...")
        proveedores_data = [
            ('Suministros Industriales S.A.', 'A44444444', 'Polígono Industrial Norte, Nave 15', '+34 91 444 44 44', 'ventas@suministros.com'),
            ('Materiales y Equipos López', 'B55555555', 'Calle de los Proveedores, 30', '+34 93 555 55 55', 'info@lopez-materiales.com'),
            ('Tecnología Avanzada S.L.', 'B66666666', 'Parque Tecnológico, Edificio A', '+34 95 666 66 66', 'contacto@tecnoavanzada.com'),
            ('Papelería Martínez', 'B77777777', 'Avenida de las Flores, 12', '+34 91 777 77 77', 'pedidos@papeleria-martinez.com'),
            ('Distribuciones del Norte', 'A88888888', 'Zona Industrial Este, Parcela 8', '+34 98 888 88 88', 'comercial@distrinorte.com'),
        ]
        
        for nombre, cif, direccion, telefono, email in proveedores_data:
            proveedor, created = Proveedor.objects.get_or_create(
                cif_nif=cif,
                empresa=empresa,
                defaults={
                    'nombre': nombre,
                    'direccion': direccion,
                    'telefono': telefono,
                    'email': email,
                }
            )
            if created:
                print(f"✓ Proveedor: {nombre}")
        
        # Crear departamentos
        print("Creando departamentos...")
        departamentos_data = [
            ('Ventas', 'Departamento de ventas y atención al cliente'),
            ('Almacén', 'Gestión de inventario y logística'),
            ('Administración', 'Contabilidad y administración'),
            ('IT', 'Tecnologías de la información'),
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
            
    except Exception as e:
        print(f"Error durante la inicialización: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    run()