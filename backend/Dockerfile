# ============================================================================
# ThaparElectiveAI Backend — Multi-Stage Production Dockerfile
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build && npm prune --omit=dev

# ----------------------------------------------------------------------------
# Production Runtime Stage
# ----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S tietapi -u 1001 -G nodejs

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder --chown=tietapi:nodejs /app/package.json ./package.json
COPY --from=builder --chown=tietapi:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=tietapi:nodejs /app/dist ./dist

USER tietapi

EXPOSE 8080

CMD ["node", "dist/index.js"]
