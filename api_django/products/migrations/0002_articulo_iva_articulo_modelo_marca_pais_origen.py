# Generated by Django 5.2.3 on 2025-06-23 09:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='articulo',
            name='iva',
            field=models.DecimalField(decimal_places=2, default=21.0, max_digits=5),
        ),
        migrations.AddField(
            model_name='articulo',
            name='modelo',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='marca',
            name='pais_origen',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
