from django.db import models

class Categoria(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)

    def __str__(self):
        return self.nombre

class Marca(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    pais_origen = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return self.nombre

    class Meta:
        ordering = ['nombre']

class Articulo(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='articulos')
    marca = models.ForeignKey(Marca, on_delete=models.CASCADE, related_name='articulos', null=True, blank=True)
    modelo = models.CharField(max_length=100, blank=True)
    precio = models.DecimalField(max_digits=8, decimal_places=2)
    stock = models.IntegerField(default=0)  # control de stock
    iva = models.DecimalField(max_digits=5, decimal_places=2, default=21.00)  # porcentaje de IVA

    def __str__(self):
        if self.marca and self.modelo:
            return f"{self.marca.nombre} {self.modelo} - {self.nombre}"
        elif self.marca:
            return f"{self.marca.nombre} - {self.nombre}"
        return self.nombre

    class Meta:
        ordering = ['marca__nombre', 'modelo', 'nombre']

class Cliente(models.Model):
    nombre = models.CharField(max_length=100)
    email = models.EmailField()
    direccion = models.CharField(max_length=200, blank=True)
    telefono = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.nombre

# Tablas intermedias para líneas de presupuesto y pedido:
class Presupuesto(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='presupuestos')
    fecha = models.DateField(auto_now_add=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    iva = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"Presupuesto #{self.id} - {self.cliente.nombre}"

class PresupuestoItem(models.Model):
    presupuesto = models.ForeignKey(Presupuesto, on_delete=models.CASCADE, related_name='items')
    articulo = models.ForeignKey(Articulo, on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=8, decimal_places=2)
    iva = models.DecimalField(max_digits=5, decimal_places=2, default=21.00)

class Pedido(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='pedidos')
    fecha = models.DateField(auto_now_add=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    iva = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    entregado = models.BooleanField(default=False)

    def __str__(self):
        return f"Pedido #{self.id} - {self.cliente.nombre}"
        
    @property
    def is_facturado(self):
        """Verifica si este pedido ya ha sido convertido a factura"""
        return hasattr(self, 'factura') and self.factura is not None

class PedidoItem(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='items')
    articulo = models.ForeignKey(Articulo, on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=8, decimal_places=2)
    iva = models.DecimalField(max_digits=5, decimal_places=2, default=21.00)

class Albaran(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='albaranes')
    fecha = models.DateField(auto_now_add=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    iva = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"Albaran #{self.id} - {self.cliente.nombre}"
        
    @property
    def is_facturado(self):
        """Verifica si este albarán ya ha sido convertido a factura"""
        return hasattr(self, 'factura') and self.factura is not None

class AlbaranItem(models.Model):
    albaran = models.ForeignKey(Albaran, on_delete=models.CASCADE, related_name='items')
    articulo = models.ForeignKey(Articulo, on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=8, decimal_places=2)
    iva = models.DecimalField(max_digits=5, decimal_places=2, default=21.00)

class Ticket(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='tickets')
    fecha = models.DateField(auto_now_add=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    iva = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"Ticket #{self.id} - {self.cliente.nombre}"
        
    @property
    def is_facturado(self):
        """Verifica si este ticket ya ha sido convertido a factura"""
        return hasattr(self, 'factura') and self.factura is not None

class TicketItem(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='items')
    articulo = models.ForeignKey(Articulo, on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=8, decimal_places=2)
    iva = models.DecimalField(max_digits=5, decimal_places=2, default=21.00)


class Factura(models.Model):
    pedido = models.OneToOneField(Pedido, on_delete=models.CASCADE, related_name='factura', null=True, blank=True)
    albaran = models.OneToOneField(Albaran, on_delete=models.CASCADE, related_name='factura', null=True, blank=True)
    ticket = models.OneToOneField(Ticket, on_delete=models.CASCADE, related_name='factura', null=True, blank=True)
    fecha = models.DateField(auto_now_add=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    iva = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Factura #{self.id} - Pedido #{self.pedido.id}"

class Departamento(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)

class Empleado(models.Model):
    nombre = models.CharField(max_length=100)
    puesto = models.CharField(max_length=100)
    departamento = models.ForeignKey(Departamento, on_delete=models.CASCADE)
    salario = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_contratacion = models.DateField()

class Proyecto(models.Model):
    ESTADOS = (
        ('PLAN', 'Planificación'),
        ('PROG', 'En progreso'),
        ('COMP', 'Completado'),
    )
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    estado = models.CharField(max_length=4, choices=ESTADOS, default='PLAN')
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    empleados = models.ManyToManyField(Empleado)
