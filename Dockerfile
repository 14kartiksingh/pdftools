FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create storage directory for PDF uploads
RUN mkdir -p storage/processed storage/uploads && chown -R node:node storage

# Copy all source files and the Next.js build output
COPY --from=builder --chown=node:node /app ./

# Strip dev dependencies to drastically reduce image size but keep all required production modules (including Prisma, BullMQ, PDF libraries)
RUN npm ci --omit=dev && npm install -g tsx prisma

USER node
EXPOSE 3000

# Chain Prisma deploy before starting Next.js
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
