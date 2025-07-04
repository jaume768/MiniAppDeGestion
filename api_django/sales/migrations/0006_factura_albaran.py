# Generated by Django 5.2.3 on 2025-07-01 23:22

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sales', '0005_albaran_serie_factura_serie_pedido_serie_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='factura',
            name='albaran',
            field=models.ForeignKey(blank=True, help_text='Albarán del que se genera esta factura', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='facturas', to='sales.albaran'),
        ),
    ]
