# install dependencies
FROM node:22-alpine as builder
WORKDIR /app
COPY package*.json ./
# Install all dependencies
RUN npm ci

# runtime
FROM node:22-alpine 
WORKDIR /app
# Only copy production dependencies
COPY package*.json ./
RUN npm ci --omit=dev
COPY . . 

EXPOSE 8000

CMD ["node", "server.js"]