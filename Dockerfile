# Étape 1 : Build de l'application
FROM node:20-alpine AS builder

WORKDIR /app

# Copier package.json et package-lock.json si existant
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le projet
COPY . .

# Build Angular avec SSR
RUN npm run build

# Étape 2 : Image finale pour exécution
FROM node:20-alpine AS runner

WORKDIR /app

# Copier uniquement les fichiers nécessaires
COPY --from=builder /app/dist/didier /app/dist/didier
COPY --from=builder /app/package*.json /app/

# Installer uniquement les dépendances de production
RUN npm install --omit=dev

# Exposer le port sur lequel ton serveur va écouter
EXPOSE 4000

# Lancer le serveur SSR
CMD ["node", "dist/didier/server/server.mjs"]