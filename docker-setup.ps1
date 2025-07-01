# Script de PowerShell para manejo de Docker en Windows
# Ejecutar como: .\docker-setup.ps1 [comando]

param(
    [Parameter(Position=0)]
    [string]$Command = "up"
)

Write-Host "=== Docker Setup Script para MiniAppDeGestion ===" -ForegroundColor Cyan

switch ($Command.ToLower()) {
    "up" {
        Write-Host "Iniciando contenedores..." -ForegroundColor Green
        docker-compose up --build
    }
    "down" {
        Write-Host "Deteniendo contenedores..." -ForegroundColor Yellow
        docker-compose down
    }
    "restart" {
        Write-Host "Reiniciando contenedores..." -ForegroundColor Blue
        docker-compose down
        docker-compose up --build
    }
    "logs" {
        Write-Host "Mostrando logs..." -ForegroundColor Magenta
        docker-compose logs -f
    }
    "clean" {
        Write-Host "Limpiando contenedores y volúmenes..." -ForegroundColor Red
        docker-compose down -v
        docker system prune -f
    }
    "shell" {
        Write-Host "Accediendo al contenedor de la API..." -ForegroundColor Cyan
        docker exec -it api-gestion /bin/bash
    }
    "mysql" {
        Write-Host "Accediendo a MySQL..." -ForegroundColor Green
        docker exec -it mysql-gestion mysql -u gestion_user -pgestion_pass123 gestion_empresa
    }
    default {
        Write-Host "Comandos disponibles:" -ForegroundColor White
        Write-Host "  up      - Iniciar contenedores (predeterminado)" -ForegroundColor Gray
        Write-Host "  down    - Detener contenedores" -ForegroundColor Gray
        Write-Host "  restart - Reiniciar contenedores" -ForegroundColor Gray
        Write-Host "  logs    - Ver logs" -ForegroundColor Gray
        Write-Host "  clean   - Limpiar todo" -ForegroundColor Gray
        Write-Host "  shell   - Acceder al contenedor API" -ForegroundColor Gray
        Write-Host "  mysql   - Acceder a MySQL" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Ejemplo: .\docker-setup.ps1 up" -ForegroundColor Yellow
    }
}
