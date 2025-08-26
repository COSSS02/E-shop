# --- Base Stage ---
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund


# --- Development Stage ---
# This is the setup for running the Vite dev server with hot-reloading.
FROM base AS dev
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# --- Build Stage ---
# This stage is responsible for creating the optimized production build.
FROM base AS build
WORKDIR /app/client
COPY . .
RUN npm run build