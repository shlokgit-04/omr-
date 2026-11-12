# OMR Checker - single container: builds the Vite frontend, runs the Express API.
# Free-tier friendly (Render/Koyeb/Northflank Docker). Listens on $PORT.
FROM node:22-bookworm-slim

# Cache the embedded MongoDB binary in the image so first boot is fast.
ENV MONGOMS_DOWNLOAD_DIR=/app/.cache/mongodb-binaries

WORKDIR /app

# --- frontend build ---
COPY frontend/package*.json frontend/
RUN cd frontend && npm install --no-audit --no-fund
COPY frontend/ frontend/
RUN cd frontend && npm run build

# --- backend runtime ---
COPY backend/package*.json backend/
RUN cd backend && npm install --omit=dev --no-audit --no-fund
COPY backend/ backend/

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "backend/server.js"]
