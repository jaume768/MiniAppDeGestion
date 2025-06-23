import os
import django
import sys

# Configurar Django
env_key = 'DJANGO_SETTINGS_MODULE'
if env_key not in os.environ:
    os.environ.setdefault(env_key, 'gestion_empresa.settings')
django.setup()

from api.models import (
    Categoria, Marca, Articulo, Cliente, Presupuesto, PresupuestoItem,
    Pedido, PedidoItem, Factura, Departamento, Empleado, Proyecto,
    Albaran, AlbaranItem, Ticket, TicketItem
)
from django.utils import timezone
from django.db import transaction


def run():
    """Inserta datos iniciales en la base de datos con nombres reales"""
    # Evitar duplicados
    if Categoria.objects.exists():
        print("Ya existen datos en la base de datos. Omitiendo inicialización.")
        return

    try:
        with transaction.atomic():
            print("Iniciando carga de datos iniciales...")

            # Crear marcas primero
            print("Creando marcas...")
            marcas_data = [
                ('Samsung', 'Empresa coreana de electrónicos', 'Corea del Sur'),
                ('Apple', 'Empresa americana de tecnología', 'Estados Unidos'),
                ('Sony', 'Empresa japonesa de electrónicos', 'Japón'),
                ('IKEA', 'Empresa sueca de muebles', 'Suecia'),
                ('HP', 'Empresa americana de computadoras', 'Estados Unidos'),
                ('Nike', 'Empresa americana de deportes', 'Estados Unidos'),
                ('Adidas', 'Empresa alemana de deportes', 'Alemania'),
                ('Zara', 'Empresa española de moda', 'España'),
                ('Moleskine', 'Empresa italiana de papelería', 'Italia'),
                ('Staedtler', 'Empresa alemana de papelería', 'Alemania'),
            ]
            
            marcas_objs = {}
            for nombre, descripcion, pais in marcas_data:
                marca = Marca.objects.create(
                    nombre=nombre,
                    descripcion=descripcion,
                    pais_origen=pais
                )
                marcas_objs[nombre] = marca
                print(f"  Marca creada: {marca.nombre}")

            # Categorías y productos con marca y modelo
            categorias_info = {
                'Electrónica': [
                    ('Smartphone Galaxy S24', 'Smartphone de última generación con cámara de 200MP', 799.99, 21.00, 'Samsung', 'Galaxy S24'),
                    ('iPhone 15 Pro', 'iPhone con chip A17 Pro y titanio', 1199.99, 21.00, 'Apple', 'iPhone 15 Pro'),
                    ('Televisor BRAVIA', 'Televisor OLED 4K de 55 pulgadas', 1299.99, 21.00, 'Sony', 'BRAVIA XR-55A80L'),
                    ('Auriculares WH-1000XM5', 'Auriculares inalámbricos con cancelación de ruido', 399.99, 21.00, 'Sony', 'WH-1000XM5'),
                    ('Laptop Pavilion', 'Laptop con procesador Intel Core i7', 899.99, 21.00, 'HP', 'Pavilion 15'),
                ],
                'Muebles': [
                    ('Mesa LACK', 'Mesa de centro minimalista', 49.99, 21.00, 'IKEA', 'LACK'),
                    ('Silla MARKUS', 'Silla de oficina ergonómica', 179.99, 21.00, 'IKEA', 'MARKUS'),
                    ('Armario PAX', 'Sistema de armario modular', 399.99, 21.00, 'IKEA', 'PAX'),
                ],
                'Papelería': [
                    ('Cuaderno Classic', 'Cuaderno con tapa dura y hojas punteadas', 24.99, 10.00, 'Moleskine', 'Classic Large'),
                    ('Lápices Mars Lumograph', 'Set de lápices profesionales para dibujo', 15.99, 10.00, 'Staedtler', 'Mars Lumograph'),
                    ('Bolígrafos Pigment Liner', 'Set de rotuladores de precisión', 12.49, 10.00, 'Staedtler', 'Pigment Liner'),
                ],
                'Ropa': [
                    ('Camiseta Air Force 1', 'Camiseta deportiva de algodón', 29.99, 21.00, 'Nike', 'Air Force 1'),
                    ('Zapatillas Stan Smith', 'Zapatillas clásicas de cuero blanco', 89.99, 21.00, 'Adidas', 'Stan Smith'),
                    ('Pantalón TRF', 'Pantalón vaquero de corte slim', 39.99, 21.00, 'Zara', 'TRF Slim'),
                    ('Sudadera Trefoil', 'Sudadera con capucha y logo Trefoil', 59.99, 21.00, 'Adidas', 'Trefoil Hoodie'),
                ],
            }

            categorias = []
            for nombre, articulos in categorias_info.items():
                cat = Categoria.objects.create(nombre=nombre)
                categorias.append(cat)
                print(f"Categoría creada: {cat.nombre}")

            articulos = []
            for cat in categorias:
                for nombre_art, descripcion, precio, iva, marca_nombre, modelo in categorias_info[cat.nombre]:
                    marca = marcas_objs[marca_nombre]
                    art = Articulo.objects.create(
                        nombre=nombre_art,
                        descripcion=descripcion,
                        precio=precio,
                        categoria=cat,
                        iva=iva,
                        marca=marca,
                        modelo=modelo
                    )
                    articulos.append(art)
                    print(f"Artículo creado: {art.nombre}, IVA: {art.iva}%")

            # Clientes reales
            clientes_data = [
                ('Acme S.A.', 'contacto@acme.com', 'Calle Mayor, 1, Madrid', '910000001'),
                ('Global Tech SL', 'info@globaltech.es', 'Av. de América, 15, Madrid', '910000002'),
                ('Soluciones Innovadoras SA', 'ventas@solinnov.com', 'Calle Alcalá, 99, Madrid', '910000003'),
            ]
            clientes = []
            for nombre, email, direccion, telefono in clientes_data:
                cli = Cliente.objects.create(
                    nombre=nombre,
                    email=email,
                    direccion=direccion,
                    telefono=telefono
                )
                clientes.append(cli)
                print(f"Cliente creado: {cli.nombre}")

            # Departamentos reales
            departamentos_data = [
                ('Ventas', 'Departamento encargado de las ventas y atención al cliente'),
                ('Recursos Humanos', 'Gestión de personal y nóminas'),
            ]
            departamentos = []
            for nombre, descripcion in departamentos_data:
                dept = Departamento.objects.create(nombre=nombre, descripcion=descripcion)
                departamentos.append(dept)
                print(f"Departamento creado: {dept.nombre}")

            # Empleados reales
            empleados_data = {
                'Ventas': [
                    ('Luis Gómez', 'Ejecutivo de Ventas', 1200.00),
                    ('Ana Torres', 'Coordinadora de Ventas', 1400.00),
                    ('David Martínez', 'Asesor Comercial', 1100.00),
                    ('Laura Rodríguez', 'Gestora de Cuentas', 1300.00),
                ],
                'Recursos Humanos': [
                    ('Sofía Fernández', 'Responsable de RRHH', 1500.00),
                    ('Carlos Sánchez', 'Técnico de Nóminas', 1350.00),
                    ('Elena Díaz', 'Recruiter', 1250.00),
                    ('Miguel García', 'Formador Interno', 1280.00),
                ],
            }
            empleados = []
            hoy = timezone.now().date()
            for dept in departamentos:
                for nombre_emp, puesto, salario in empleados_data[dept.nombre]:
                    emp = Empleado.objects.create(
                        nombre=nombre_emp,
                        puesto=puesto,
                        departamento=dept,
                        salario=salario,
                        fecha_contratacion=hoy
                    )
                    empleados.append(emp)
                    print(f"Empleado creado: {emp.nombre}")

            # Proyectos reales
            proyectos_data = [
                ('Implementación ERP', 'Instalación y configuración de nuevo sistema ERP', 'PLAN'),
                ('Campaña Marketing Verano', 'Lanzamiento de la campaña de verano en redes sociales', 'PLAN'),
            ]
            proyectos = []
            for idx, (nombre, descripcion, estado) in enumerate(proyectos_data):
                proy = Proyecto.objects.create(
                    nombre=nombre,
                    descripcion=descripcion,
                    estado=estado,
                    fecha_inicio=hoy,
                    fecha_fin=hoy + timezone.timedelta(days=30)
                )
                # Asignar dos empleados por proyecto
                proy.empleados.set(empleados[idx*2:(idx*2+2)])
                proyectos.append(proy)
                print(f"Proyecto creado: {proy.nombre}")

            # Crear un presupuesto de ejemplo
            seleccion = articulos[:3]
            presupuesto = Presupuesto.objects.create(
                cliente=clientes[0],
                fecha=hoy,
                total=0
            )
            total_pres = 0
            for art in seleccion:
                cantidad = 2
                precio_unitario = float(art.precio)
                PresupuestoItem.objects.create(
                    presupuesto=presupuesto,
                    articulo=art,
                    cantidad=cantidad,
                    precio_unitario=precio_unitario
                )
                total_pres += cantidad * precio_unitario
            presupuesto.total = total_pres
            presupuesto.save()
            print(f"Presupuesto creado: #{presupuesto.id} -> {presupuesto.total}€")

            # Crear pedido de ejemplo
            pedido = Pedido.objects.create(
                cliente=clientes[0],
                fecha=hoy,
                total=0,
                entregado=False
            )
            total_ped = 0
            for art in seleccion:
                cantidad = 2
                precio_unitario = float(art.precio)
                PedidoItem.objects.create(
                    pedido=pedido,
                    articulo=art,
                    cantidad=cantidad,
                    precio_unitario=precio_unitario
                )
                total_ped += cantidad * precio_unitario
            pedido.total = total_ped
            pedido.save()
            print(f"Pedido creado: #{pedido.id} -> {pedido.total}€")

            # Factura
            factura = Factura.objects.create(
                pedido=pedido,
                fecha=hoy,
                total=pedido.total
            )
            print(f"Factura creada: #{factura.id} -> {factura.total}€")

            # Crear albaran de ejemplo
            albaran = Albaran.objects.create(
                cliente=clientes[0],
                fecha=hoy,
                total=0
            )
            total_alb = 0
            for art in seleccion:
                cantidad = 1
                precio_unitario = float(art.precio)
                AlbaranItem.objects.create(
                    albaran=albaran,
                    articulo=art,
                    cantidad=cantidad,
                    precio_unitario=precio_unitario
                )
                total_alb += cantidad * precio_unitario
            albaran.total = total_alb
            albaran.save()
            print(f"Albaran creado: #{albaran.id} -> {albaran.total}€")
            
            # Crear ticket de ejemplo
            ticket = Ticket.objects.create(
                cliente=clientes[0],
                fecha=hoy,
                total=0
            )
            total_ticket = 0
            for art in seleccion:
                cantidad = 1
                precio_unitario = float(art.precio)
                TicketItem.objects.create(
                    ticket=ticket,
                    articulo=art,
                    cantidad=cantidad,
                    precio_unitario=precio_unitario
                )
                total_ticket += cantidad * precio_unitario
            ticket.total = total_ticket
            ticket.save()
            print(f"Ticket creado: #{ticket.id} -> {ticket.total}€")

            print('¡Datos iniciales insertados exitosamente!')
    except Exception as e:
        print(f"Error al insertar datos iniciales: {e}")
        sys.exit(1)


if __name__ == "__main__":
    run()