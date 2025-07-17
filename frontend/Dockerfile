FROM node:18

WORKDIR /app

# Copiar package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código de la aplicación
COPY . .

# Exponer el puerto 3000
EXPOSE 3000

# Comando para desarrollo con hot-reload
CMD ["npm", "run", "dev"]
