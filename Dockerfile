# Multi-stage Dockerfile: Node.js Backend + Typesense in one container
# This allows running both services together on a single Render instance

FROM node:20-alpine AS base

# Install Typesense binary
FROM base AS typesense-installer
WORKDIR /tmp
RUN apk add --no-cache curl tar && \
    curl -O https://dl.typesense.org/releases/27.1/typesense-server-27.1-linux-amd64.tar.gz && \
    tar -xzf typesense-server-27.1-linux-amd64.tar.gz && \
    chmod +x typesense-server

# Final stage: Node.js + Typesense
FROM base
WORKDIR /app

# Install supervisor to manage multiple processes
RUN apk add --no-cache supervisor

# Copy Typesense binary
COPY --from=typesense-installer /tmp/typesense-server /usr/local/bin/typesense-server

# Copy backend code
COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ ./

# Generate Prisma Client
RUN npx prisma generate

# Create directories
RUN mkdir -p /data/typesense /var/log/supervisor

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisord.conf

# Expose ports
EXPOSE 5000 8108

# Start supervisor (manages both Node.js and Typesense)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
