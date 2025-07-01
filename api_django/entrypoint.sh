#!/bin/sh
set -e

# Esperar a que la base de datos esté disponible usando dockerize
echo "Esperando a que la base de datos esté disponible..."
dockerize -wait tcp://db:3306 -timeout 60s

# Aplicar migraciones
echo "Aplicando migraciones..."
python manage.py makemigrations --noinput || true
python manage.py migrate --noinput

# Cargar datos iniciales si existe el archivo
echo "Cargando datos iniciales..."
if [ -f "init_db.py" ]; then
    python init_db.py || echo "Warning: No se pudieron cargar los datos iniciales"
else
    echo "Warning: init_db.py no encontrado, saltando carga de datos iniciales"
fi

# Crear superusuario si no existe (opcional)
echo "Verificando superusuario..."
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin123')" || echo "Superusuario ya existe o no se pudo crear"

# Iniciar el servidor Django
echo "Iniciando servidor Django..."
exec "$@"
