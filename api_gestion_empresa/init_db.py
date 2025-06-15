import os
import django
import sys

# Configurar Django
env_key = 'DJANGO_SETTINGS_MODULE'
if env_key not in os.environ:
    os.environ.setdefault(env_key, 'gestion_empresa.settings')
django.setup()

from api.models import (
    Categoria, Articulo, Cliente, Presupuesto, PresupuestoItem,
    Pedido, PedidoItem, Factura, Departamento, Empleado, Proyecto
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

            # Categorías reales
            categorias_info = {
                'Electrónica': [
                    ('Smartphone X', 'Smartphone de última generación', 799.99),
                    ('Televisor 42" LED', 'Televisor LED Full HD de 42 pulgadas', 499.99),
                    ('Auriculares Bluetooth', 'Auriculares inalámbricos con cancelación de ruido', 129.99),
                ],
                'Muebles': [
                    ('Mesa de comedor', 'Mesa extensible para 6 personas', 249.99),
                    ('Silla ergonómica', 'Silla de oficina con soporte lumbar', 179.99),
                    ('Armario de madera', 'Armario ropero de pino macizo', 399.99),
                ],
                'Papelería': [
                    ('Cuaderno premium', 'Cuaderno A5 con tapas duras', 9.99),
                    ('Bolígrafo gel', 'Pack de 5 bolígrafos de tinta gel', 4.99),
                    ('Carpeta A4', 'Carpeta clasificadora de 6 anillas', 6.49),
                ],
                'Ropa': [
                    ('Camiseta algodón', 'Camiseta básica de algodón 100%', 14.99),
                    ('Pantalón vaquero', 'Jeans clásico azul', 39.99),
                    ('Sudadera con capucha', 'Sudadera con bolsillo frontal', 29.99),
                ],
                'Hogar': [
                    ('Set de cuchillos', 'Set de 6 cuchillos de acero inoxidable', 59.99),
                    ('Aspiradora Dyson', 'Aspiradora sin cable, alta potencia', 299.99),
                    ('Lámpara de mesa', 'Lámpara de escritorio LED ajustable', 24.99),
                ],
            }

            categorias = []
            for nombre, articulos in categorias_info.items():
                cat = Categoria.objects.create(nombre=nombre)
                categorias.append(cat)
                print(f"Categoría creada: {cat.nombre}")

            articulos = []
            for cat in categorias:
                for nombre_art, descripcion, precio in categorias_info[cat.nombre]:
                    art = Articulo.objects.create(
                        nombre=nombre_art,
                        descripcion=descripcion,
                        precio=precio,
                        categoria=cat
                    )
                    articulos.append(art)
                    print(f"Artículo creado: {art.nombre}")

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

            print('¡Datos iniciales insertados exitosamente!')
    except Exception as e:
        print(f"Error al insertar datos iniciales: {e}")
        sys.exit(1)


if __name__ == "__main__":
    run()