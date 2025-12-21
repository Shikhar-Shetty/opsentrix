# Stage 1: Build the application
FROM node:20-slim AS builder

WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl libssl-dev

COPY package*.json ./
RUN npm ci 

COPY . .

RUN npm run build

# Stage 2: Runtime environment
FROM node:20-slim
WORKDIR /app

RUN apt-get update -y &&  apt-get install -y openssl libssl-dev
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next

EXPOSE 3000
CMD [ "npm", "start" ]