FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# The command to run the dev server.
# The "-- --host 0.0.0.0" part is crucial for making it accessible from your host machine.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]