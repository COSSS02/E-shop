# E-shop

This project is configured to run in Docker for both development and production environments. The primary method for managing the application is through Docker Compose.

## Prerequisites

1.  **Docker & Docker Compose:** Ensure you have the latest versions installed.
2.  **Local Database:** A MariaDB instance must be running on your host machine.
3.  **Host Configuration:**
    *   Your MariaDB `bind-address` must be set to `0.0.0.0` to allow connections from Docker.
    *   Your host firewall must allow connections from Docker's subnets to your MariaDB port (e.g., `3306`).
    *   Your `server/.env` file must be configured, with `DB_HOST=host.docker.internal`.

---

## Primary Workflow: Docker Compose

All `docker-compose` commands should be run from the project's root directory.

### Development Environment

This command starts both the client and server containers in development mode with hot-reloading enabled. It automatically uses both `docker-compose.yml` and `docker-compose.override.yml`.

```bash
docker-compose up --build
```

### Production Environment

This command builds and starts only the single, optimized production server, which serves both the API and the pre-built frontend. It explicitly uses *only* the base `docker-compose.yml` file.

```bash
docker-compose -f docker-compose.yml up --build
```

### Stopping the Environment

To stop all running containers defined in your compose setup, run:

```bash
docker-compose down
```

---

## Manual Container Management (for debugging)

These commands are for building or running a single service, which can be useful for debugging. All commands should be run from the project's root directory.

### Server

#### Build Dev Image
```bash
docker build -t e-shop-server:dev -f server/Dockerfile --target dev .
```

#### Build Prod Image
```bash
docker build -t e-shop-server:prod -f server/Dockerfile --target runner .
```

#### Run Dev Container
```bash
docker run --name e-shop-server-dev --rm -it -p 3000:3000 \
--add-host=host.docker.internal:host-gateway --env-file server/.env \
-v "$(pwd)/server/certs:/app/certs:ro" -v "$(pwd)/server:/app" \
-v /app/node_modules e-shop-server:dev
```

#### Run Prod Container
```bash
docker run --name e-shop-server-prod --rm -it -p 3000:3000 \
--add-host=host.docker.internal:host-gateway --env-file server/.env \
-v "$(pwd)/server/certs:/app/certs:ro" e-shop-server:prod
```

### Client

#### Build Dev Image
```bash
docker build -t e-shop-client:dev -f client/Dockerfile --target dev client
```

#### Run Dev Container
```bash
docker run --name e-shop-client-dev --rm -it -p 5173:5173 \
--add-host=host.docker.internal:host-gateway \
-v "$(pwd)/client/certs:/app/certs:ro" -v "$(pwd)/client:/app" \
-v /app/node_modules -e CHOKIDAR_USEPOLLING=1 e-shop-client:dev
```