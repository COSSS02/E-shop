# --- Development Stage ---
FROM node:20-alpine AS dev
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]


# --- Client Build Stage ---
# This stage builds the React frontend and creates the /dist folder.
# It requires the build context to be the project root.
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --no-audit --no-fund
COPY client/. .
RUN npm run build


# --- Production Dependencies Stage ---
# This stage installs *only* the production dependencies for the server
# to keep the final image as small as possible.
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund


# --- Final Production Runner Stage ---
# This is the final, optimized image that will be deployed.
# It copies artifacts from the previous stages.
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy production node_modules from the prod-deps stage
COPY --from=prod-deps /app/node_modules ./node_modules

COPY server/. .

# Copy the built client 'dist' folder from the client-builder stage
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 3000
CMD ["npm", "start"]