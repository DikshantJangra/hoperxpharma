#!/bin/bash

# Typesense Setup Script
# Sets up Typesense for Medicine Master search functionality

set -e

echo "🔍 Typesense Setup for Medicine Master"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Configuration
TYPESENSE_VERSION="26.0"
TYPESENSE_PORT=8108
TYPESENSE_API_KEY="${TYPESENSE_API_KEY:-development_api_key_change_in_production}"
TYPESENSE_DATA_DIR="${TYPESENSE_DATA_DIR:-$HOME/.typesense-data}"

echo "Configuration:"
echo "  Version: $TYPESENSE_VERSION"
echo "  Port: $TYPESENSE_PORT"
echo "  API Key: $TYPESENSE_API_KEY"
echo "  Data Directory: $TYPESENSE_DATA_DIR"
echo ""

# Check if Typesense container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^typesense$"; then
    echo "⚠️  Typesense container already exists"
    read -p "Do you want to remove and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Removing existing container..."
        docker stop typesense 2>/dev/null || true
        docker rm typesense 2>/dev/null || true
    else
        echo "ℹ️  Starting existing container..."
        docker start typesense
        echo "✅ Typesense is running on port $TYPESENSE_PORT"
        exit 0
    fi
fi

# Create data directory
mkdir -p "$TYPESENSE_DATA_DIR"
echo "✅ Created data directory: $TYPESENSE_DATA_DIR"

# Pull Typesense image
echo "📥 Pulling Typesense image..."
docker pull typesense/typesense:$TYPESENSE_VERSION

# Run Typesense container
echo "🚀 Starting Typesense container..."
docker run -d \
  --name typesense \
  -p $TYPESENSE_PORT:8108 \
  -v "$TYPESENSE_DATA_DIR:/data" \
  typesense/typesense:$TYPESENSE_VERSION \
  --data-dir /data \
  --api-key=$TYPESENSE_API_KEY \
  --enable-cors

echo ""
echo "✅ Typesense is running!"
echo ""
echo "Connection Details:"
echo "  Host: localhost"
echo "  Port: $TYPESENSE_PORT"
echo "  Protocol: http"
echo "  API Key: $TYPESENSE_API_KEY"
echo ""
echo "Health Check:"
curl -s http://localhost:$TYPESENSE_PORT/health || echo "⚠️  Health check failed - container may still be starting"
echo ""
echo ""
echo "Next Steps:"
echo "1. Add to backend/.env:"
echo "   TYPESENSE_HOST=localhost"
echo "   TYPESENSE_PORT=$TYPESENSE_PORT"
echo "   TYPESENSE_PROTOCOL=http"
echo "   TYPESENSE_API_KEY=$TYPESENSE_API_KEY"
echo "   TYPESENSE_COLLECTION_NAME=medicines"
echo ""
echo "2. Initialize the search collection:"
echo "   npm run medicine:init-search"
echo ""
echo "3. Build the search index:"
echo "   npm run medicine:rebuild-index"
echo ""
echo "Useful Commands:"
echo "  docker logs typesense          # View logs"
echo "  docker stop typesense          # Stop container"
echo "  docker start typesense         # Start container"
echo "  docker restart typesense       # Restart container"
echo "  docker rm -f typesense         # Remove container"
echo ""
