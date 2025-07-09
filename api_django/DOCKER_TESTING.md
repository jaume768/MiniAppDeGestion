# 🐳 Ejecutar Tests con Docker

## 📋 Configuración para Testing con Docker

### 1. Dockerfile Optimizado para Tests

Crea un `Dockerfile.test` optimizado para testing:

```dockerfile
FROM python:3.11-slim

# Variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=gestion_empresa.settings

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

# Comando por defecto para tests
CMD ["pytest", "-v", "--cov=.", "--cov-report=term-missing"]
```

### 2. Docker Compose para Testing

Crea o modifica `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  web-test:
    build:
      context: .
      dockerfile: Dockerfile.test
    volumes:
      - .:/app
      - test-data:/app/test_data
    environment:
      - DEBUG=True
      - SECRET_KEY=test-secret-key-very-long-and-secure
      - DATABASE_URL=mysql://test_user:test_password@db-test:3306/test_db
      - ALLOWED_HOSTS=localhost,127.0.0.1
    depends_on:
      - db-test
    command: >
      sh -c "python manage.py migrate --run-syncdb &&
             pytest -v --cov=. --cov-report=html --cov-report=term-missing"

  db-test:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: test_db
      MYSQL_USER: test_user
      MYSQL_PASSWORD: test_password
      MYSQL_ROOT_PASSWORD: root_password
    volumes:
      - mysql_test_data:/var/lib/mysql
    ports:
      - "3307:3306"  # Puerto diferente para no conflictuar
    command: --default-authentication-plugin=mysql_native_password

volumes:
  mysql_test_data:
  test-data:
```

## 🚀 Comandos para Ejecutar Tests

### Opción 1: Tests Completos con Docker Compose

```bash
# Ejecutar todos los tests
docker-compose -f docker-compose.test.yml up --build

# Ejecutar tests y mantener contenedores para debug
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Limpiar después de tests
docker-compose -f docker-compose.test.yml down -v
```

### Opción 2: Tests Interactivos dentro del Contenedor

```bash
# Levantar solo la base de datos de test
docker-compose -f docker-compose.test.yml up -d db-test

# Ejecutar contenedor interactivo
docker run -it --rm \
  --network minigestión_default \
  -v $(pwd):/app \
  -e DATABASE_URL=mysql://test_user:test_password@db-test:3306/test_db \
  minigestion-web-test bash

# Dentro del contenedor, ejecutar tests
python manage.py migrate --run-syncdb
pytest -v
```

### Opción 3: Tests con API en Ejecución

Si ya tienes la API ejecutándose con `docker-compose up`:

```bash
# En una nueva terminal, ejecutar tests contra la API corriendo
docker-compose exec api pytest -v

# Ejecutar tests específicos
docker-compose exec api pytest products/tests.py -v

# Tests con cobertura
docker-compose exec api pytest --cov=products --cov-report=html

# Tests de una clase específica
docker-compose exec api pytest products/tests.py::TestProductoModels -v
```

## 📊 Comandos de Testing Específicos

### Tests por Módulo

```bash
# Tests de productos
docker-compose exec api pytest products/tests.py -v

# Tests de inventario
docker-compose exec api pytest inventory/tests.py -v

# Tests de ventas
docker-compose exec api pytest sales/tests.py -v
```

### Tests por Tipo

```bash
# Solo tests unitarios
docker-compose exec api pytest -m unit -v

# Solo tests de integración
docker-compose exec api pytest -m integration -v

# Solo tests de API
docker-compose exec api pytest -m api -v

# Tests de rendimiento
docker-compose exec api pytest -m performance -v
```

### Tests con Filtros

```bash
# Tests que contienen "articulo"
docker-compose exec api pytest -k "articulo" -v

# Tests que NO son lentos
docker-compose exec api pytest -k "not slow" -v

# Tests específicos de un método
docker-compose exec api pytest products/tests.py::TestProductoModels::test_creacion_articulo -v
```

## 📈 Reportes de Cobertura

### Generar Reportes HTML

```bash
# Generar reporte HTML de cobertura
docker-compose exec api pytest --cov=. --cov-report=html

# Copiar reportes fuera del contenedor
docker cp $(docker-compose ps -q api):/app/htmlcov ./test-reports/
```

### Ver Reportes

```bash
# Abrir reporte en navegador (Linux)
firefox ./test-reports/index.html

# Abrir reporte en navegador (macOS)
open ./test-reports/index.html
```

## 🔧 Configuración de Variables de Entorno

### Archivo `.env.test`

```bash
# Crear archivo específico para tests
cat > .env.test << EOF
DEBUG=True
SECRET_KEY=test-secret-key-very-long-and-secure-for-testing-only
DATABASE_URL=mysql://test_user:test_password@db:3306/test_db
ALLOWED_HOSTS=localhost,127.0.0.1,web
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
JWT_SECRET_KEY=test-jwt-secret-key-very-long-and-secure
EOF
```

### Usar Variables en Docker

```bash
# Ejecutar con archivo de entorno específico
docker-compose --env-file .env.test -f docker-compose.test.yml up
```

## 🚨 Troubleshooting

### Problema: Tests Fallan por Base de Datos

```bash
# Verificar conexión a base de datos
docker-compose exec api python manage.py dbshell

# Recrear base de datos
docker-compose exec api python manage.py flush --noinput
docker-compose exec api python manage.py migrate
```

### Problema: Importaciones Fallan

```bash
# Verificar instalación de dependencias
docker-compose exec api pip list

# Reinstalar dependencias
docker-compose exec api pip install -r requirements.txt
```

### Problema: Tests Lentos

```bash
# Ejecutar tests en paralelo
docker-compose exec api pytest -n auto

# Identificar tests lentos
docker-compose exec api pytest --durations=10
```

## 📋 Script de Automatización

Crea un script `run-tests.sh`:

```bash
#!/bin/bash

set -e

echo "🧪 Iniciando tests automatizados..."

# Limpiar contenedores previos
echo "🧹 Limpiando contenedores previos..."
docker-compose -f docker-compose.test.yml down -v

# Construir imagen de test
echo "🔨 Construyendo imagen de test..."
docker-compose -f docker-compose.test.yml build

# Ejecutar tests
echo "🚀 Ejecutando tests..."
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Copiar reportes
echo "📊 Copiando reportes de cobertura..."
docker cp $(docker-compose -f docker-compose.test.yml ps -q web-test):/app/htmlcov ./test-reports/ 2>/dev/null || echo "Sin reportes HTML"

# Limpiar
echo "🧹 Limpiando..."
docker-compose -f docker-compose.test.yml down -v

echo "✅ Tests completados!"
echo "📊 Ver reportes en: ./test-reports/index.html"
```

Dar permisos de ejecución:

```bash
chmod +x run-tests.sh
./run-tests.sh
```

## 🎯 Mejores Prácticas

### 1. Base de Datos Separada
- Usa siempre una base de datos separada para tests
- Puerto diferente (3307) para evitar conflictos

### 2. Optimización de Velocidad
```bash
# Usar --reuse-db para tests más rápidos
docker-compose exec api pytest --reuse-db

# Tests en paralelo
docker-compose exec api pytest -n auto
```

### 3. Tests de Integración
```bash
# Tests completos incluyendo base de datos
docker-compose exec api pytest -m integration

# Tests solo de API
docker-compose exec api pytest -m api
```

### 4. Depuración
```bash
# Tests con output detallado
docker-compose exec api pytest -vvv -s

# Usar debugger
docker-compose exec api pytest --pdb
```

¡Con esta configuración puedes ejecutar tests de forma robusta usando Docker mientras tu API está ejecutándose!
