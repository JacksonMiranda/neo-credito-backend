FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl python3 make g++

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine

RUN apk add --no-cache openssl python3 make g++

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci \
  && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$SEED_DATABASE\" = \"true\" ]; then npm run prisma:seed; fi && node dist/main"]
