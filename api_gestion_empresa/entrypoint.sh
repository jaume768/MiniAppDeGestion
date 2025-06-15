#!/bin/sh

# Esperar a que la base de datos esté disponible
echo "Esperando a que la base de datos esté disponible..."
sleep 10

# Aplicar migraciones
echo "Aplicando migraciones..."
python manage.py makemigrations
python manage.py migrate

# Cargar datos iniciales
echo "Cargando datos iniciales..."
python init_db.py

# Iniciar el servidor Django
echo "Iniciando servidor Django..."
exec "$@"
