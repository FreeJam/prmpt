# PRMPT — образ приложения (API + собранный SPA)
FROM node:22-alpine AS web
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
COPY shared/ /app/shared/
RUN npx vite build --outDir dist --emptyOutDir

FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=8030 \
    HOST=0.0.0.0 \
    PRMPT_DIST=/app/web/dist \
    PRMPT_DATA_DIR=/app/data
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY server/ ./server/
COPY shared/ ./shared/
COPY --from=web /app/web/dist ./web/dist
RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 8030
HEALTHCHECK --interval=30s --timeout=4s --start-period=5s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8030)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/index.js"]
