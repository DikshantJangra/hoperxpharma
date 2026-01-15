#!/bin/bash

# Typesense Cloud Setup Script
# For production deployment using Typesense Cloud

set -e

echo "🔍 Typesense Cloud Setup for Medicine Master"
echo "=============================================="
echo ""

# Check if environment variables are set
if [ -z "$TYPESENSE_HOST" ] || [ -z "$TYPESENSE_API_KEY" ]; then
    echo "⚠️  Typesense Cloud credentials not found in environment"
    echo ""
    echo "Please set the following environment variables:"
    echo ""
    echo "  export TYPESENSE_HOST=xxx-1.a1.typesense.net"
    echo "  export TYPESENSE_PORT=443"
    echo "  export TYPESENSE_PROTOCOL=https"
    echo "  export TYPESENSE_API_KEY=your-api-key-here"
    echo "  export TYPESENSE_COLLECTION_NAME=medicines"
    echo ""
    echo "Or add them to backend/.env:"
    echo ""
    echo "  TYPESENSE_HOST=xxx-1.a1.typesense.net"
    echo "  TYPESENSE_PORT=443"
    echo "  TYPESENSE_PROTOCOL=https"
    echo "  TYPESENSE_API_KEY=your-api-key-here"
    echo "  TYPESENSE_COLLECTION_NAME=medicines"
    echo ""
    echo "Get your credentials from: https://cloud.typesense.org"
    echo ""
    exit 1
fi

echo "Configuration:"
echo "  Host: $TYPESENSE_HOST"
echo "  Port: ${TYPESENSE_PORT:-443}"
echo "  Protocol: ${TYPESENSE_PROTOCOL:-https}"
echo "  Collection: ${TYPESENSE_COLLECTION_NAME:-medicines}"
echo ""

# Test connection
echo "🔌 Testing connection to Typesense Cloud..."
HEALTH_URL="${TYPESENSE_PROTOCOL:-https}://${TYPESENSE_HOST}:${TYPESENSE_PORT:-443}/health"

if curl -s -f "$HEALTH_URL" > /dev/null 2>&1; then
    echo "✅ Connected to Typesense Cloud successfully!"
else
    echo "❌ Failed to connect to Typesense Cloud"
    echo "   URL: $HEALTH_URL"
    echo ""
    echo "Please check:"
    echo "  1. Your Typesense cluster is running"
    echo "  2. The host and port are correct"
    echo "  3. Your network allows HTTPS connections"
    echo ""
    exit 1
fi

echo ""
echo "✅ Typesense Cloud is ready!"
echo ""
echo "Next Steps:"
echo "1. Initialize the search collection:"
echo "   npm run medicine:init-search"
echo ""
echo "2. Build the search index:"
echo "   npm run medicine:rebuild-index"
echo ""
echo "3. Test search:"
echo "   curl \"${TYPESENSE_PROTOCOL:-https}://${TYPESENSE_HOST}:${TYPESENSE_PORT:-443}/collections/${TYPESENSE_COLLECTION_NAME:-medicines}/documents/search?q=test&query_by=name\" \\"
echo "     -H \"X-TYPESENSE-API-KEY: \$TYPESENSE_API_KEY\""
echo ""
