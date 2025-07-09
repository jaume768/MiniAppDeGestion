#!/bin/bash

# Script para ejecutar tests con Docker
# Uso: ./run-tests.sh [opciones]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo "🧪 Script de Tests para MiniGestión API"
    echo ""
    echo "Uso: $0 [OPCIONES]"
    echo ""
    echo "OPCIONES:"
    echo "  -h, --help          Mostrar esta ayuda"
    echo "  -a, --all           Ejecutar todos los tests (por defecto)"
    echo "  -u, --unit          Solo tests unitarios"
    echo "  -i, --integration   Solo tests de integración"
    echo "  -p, --api           Solo tests de API"
    echo "  -c, --coverage      Generar reporte de cobertura HTML"
    echo "  -f, --fast          Ejecutar tests rápidos (sin migraciones)"
    echo "  -v, --verbose       Output detallado"
    echo "  -s, --specific APP  Ejecutar tests de una app específica"
    echo ""
    echo "EJEMPLOS:"
    echo "  $0                  # Todos los tests"
    echo "  $0 -u -c           # Tests unitarios con cobertura"
    echo "  $0 -s products     # Solo tests de products"
    echo "  $0 -i -v           # Tests de integración verbose"
}

# Variables por defecto
TEST_TYPE="all"
COVERAGE=false
FAST=false
VERBOSE=false
SPECIFIC_APP=""

# Procesar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -a|--all)
            TEST_TYPE="all"
            shift
            ;;
        -u|--unit)
            TEST_TYPE="unit"
            shift
            ;;
        -i|--integration)
            TEST_TYPE="integration"
            shift
            ;;
        -p|--api)
            TEST_TYPE="api"
            shift
            ;;
        -c|--coverage)
            COVERAGE=true
            shift
            ;;
        -f|--fast)
            FAST=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -s|--specific)
            SPECIFIC_APP="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}❌ Opción desconocida: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Función para log con color
log() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Verificar si Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    log $RED "❌ Docker no está ejecutándose. Inicia Docker primero."
    exit 1
fi

# Verificar si la API está corriendo
if ! docker-compose ps | grep -q "api.*Up"; then
    log $YELLOW "⚠️  La API no está ejecutándose. Iniciando..."
    docker-compose up -d
    sleep 10
fi

log $BLUE "🧪 Iniciando tests automatizados..."

# Construir comando pytest
PYTEST_CMD="pytest"

# Agregar verbosidad
if [ "$VERBOSE" = true ]; then
    PYTEST_CMD="$PYTEST_CMD -vvv"
else
    PYTEST_CMD="$PYTEST_CMD -v"
fi

# Agregar cobertura
if [ "$COVERAGE" = true ]; then
    PYTEST_CMD="$PYTEST_CMD --cov=. --cov-report=html:htmlcov --cov-report=term-missing"
    log $BLUE "📊 Generando reporte de cobertura..."
fi

# Agregar flags para tests rápidos
if [ "$FAST" = true ]; then
    PYTEST_CMD="$PYTEST_CMD --reuse-db --nomigrations"
    log $BLUE "⚡ Modo rápido activado..."
fi

# Agregar filtros por tipo de test
case $TEST_TYPE in
    "unit")
        PYTEST_CMD="$PYTEST_CMD -m unit"
        log $BLUE "🔬 Ejecutando solo tests unitarios..."
        ;;
    "integration")
        PYTEST_CMD="$PYTEST_CMD -m integration"
        log $BLUE "🔗 Ejecutando solo tests de integración..."
        ;;
    "api")
        PYTEST_CMD="$PYTEST_CMD -m api"
        log $BLUE "🌐 Ejecutando solo tests de API..."
        ;;
    "all")
        log $BLUE "🎯 Ejecutando todos los tests..."
        ;;
esac

# Agregar app específica
if [ ! -z "$SPECIFIC_APP" ]; then
    PYTEST_CMD="$PYTEST_CMD ${SPECIFIC_APP}/tests.py"
    log $BLUE "📱 Ejecutando tests de: $SPECIFIC_APP"
fi

# Crear directorio para reportes si no existe
mkdir -p test-reports

# Ejecutar tests
log $BLUE "🚀 Comando: docker-compose exec api $PYTEST_CMD"
echo ""

if docker-compose exec api $PYTEST_CMD; then
    log $GREEN "✅ Tests completados exitosamente!"
    
    # Copiar reportes de cobertura si se generaron
    if [ "$COVERAGE" = true ]; then
        log $BLUE "📊 Copiando reportes de cobertura..."
        docker cp $(docker-compose ps -q api):/app/htmlcov ./test-reports/ 2>/dev/null || {
            log $YELLOW "⚠️  No se pudieron copiar los reportes HTML"
        }
        
        if [ -d "./test-reports/htmlcov" ]; then
            log $GREEN "📈 Reporte de cobertura disponible en: ./test-reports/htmlcov/index.html"
        fi
    fi
    
else
    log $RED "❌ Tests fallaron!"
    exit 1
fi

# Mostrar estadísticas finales
echo ""
log $BLUE "📊 Estadísticas de los tests:"
docker-compose exec api pytest --collect-only -q 2>/dev/null | tail -n 1 || echo "No se pudieron obtener estadísticas"

echo ""
log $GREEN "🎉 ¡Proceso completado!"
