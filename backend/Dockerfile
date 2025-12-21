FROM node:20-slim AS builder

WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl libssl-dev

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl libssl-dev

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/src ./src

RUN npm install --save-dev ts-node typescript

EXPOSE 4000

RUN npm install -g tsx
CMD ["tsx", "src/index.ts"]