FROM python:3.11-slim

WORKDIR /app

# Evitar que Python genere archivos .pyc
ENV PYTHONDONTWRITEBYTECODE 1
# Evitar que Python almacene en búfer la salida estándar
ENV PYTHONUNBUFFERED 1

# Instalar dependencias del sistema necesarias para mysqlclient
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    pkg-config \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el proyecto
COPY . .

# Puerto en el que corre la aplicación
EXPOSE 8000

# Comando para iniciar la aplicación
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
