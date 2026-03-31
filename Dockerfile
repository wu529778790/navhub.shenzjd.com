FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_GITHUB_CLIENT_ID
ENV NEXT_PUBLIC_GITHUB_CLIENT_ID=${NEXT_PUBLIC_GITHUB_CLIENT_ID}
ENV NODE_ENV=production

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system nodejs && \
    adduser --system --no-create-home --shell /bin/false nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js

RUN npm ci --omit=dev

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

USER nextjs
CMD ["node", "node_modules/next/dist/bin/next", "start"]
