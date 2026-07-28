FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies but we need to ensure next.config.ts can be parsed
# The easiest way without changing their next.config is to include typescript
COPY package*.json ./

RUN npm ci --omit=dev && npm install typescript

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000

CMD ["npm", "run", "start"]