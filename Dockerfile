# OMR Checker - production image: Express API + built React frontend in one container.
FROM node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Cache the embedded MongoDB binary into the image so first boot is fast.
ENV MONGOMS_DOWNLOAD_DIR=/app/.cache/mongodb-binaries

WORKDIR /app
RUN git clone --depth 1 https://github.com/shlokgit-04/omr-.git .

# Build the React (Vite) frontend
WORKDIR /app/frontend
RUN npm install --no-audit --no-fund \
 && npm run build

# Backend runtime deps
WORKDIR /app/backend
RUN npm install --omit=dev --no-audit --no-fund

# Warm the MongoDB binary cache (safe if it was already fetched by postinstall)
RUN node -e "require('mongodb-memory-server').MongoMemoryServer.create().then(m=>{console.log('mongod cached');return m.stop();}).catch(e=>console.warn('cache skip:',e.message))" || true

ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860

CMD ["node", "server.js"]
