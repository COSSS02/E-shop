# E-shop

### Build server
```bash
docker build -t e-shop-server:dev .
```

### Run server
```bash
docker run --name e-shop-server --rm -it -p 3000:3000 \
--add-host=host.docker.internal:host-gateway --env-file .env \
-v "$(pwd)/certs:/app/certs:ro" -v "$(pwd):/app" \
-v /app/node_modules e-shop-server:dev
```

### Build client
```bash
docker build -t e-shop-client:dev .
```

### Run client
```bash
docker run --name e-shop-client --rm -it -p 5173:5173 \
--add-host=host.docker.internal:host-gateway \
-v "$(pwd)/certs:/app/certs:ro" -v "$(pwd):/app" \
-v /app/node_modules -e CHOKIDAR_USEPOLLING=1 e-shop-client:dev
```

### Docker Compose
```bash
docker-compose up --build
docker-compose down
```