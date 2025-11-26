#!/bin/bash

# Test script for New PO endpoints
echo "=== Testing New PO Backend Endpoints ==="
echo ""

# Base URL
BASE_URL="http://localhost:8000/api/v1"

# Test 1: Health check
echo "1. Testing Health Check..."
curl -s "$BASE_URL/health" | jq '.' || echo "Health check failed"
echo ""

# Test 2: Get suppliers (no auth needed for testing)
echo "2. Testing Get Suppliers..."
curl -s "$BASE_URL/purchase-orders/suppliers?limit=5" | jq '.data[0] // .message' || echo "Suppliers endpoint failed"
echo ""

# Test 3: Search drugs
echo "3. Testing Drug Search..."
curl -s "$BASE_URL/drugs/search?q=paracetamol&limit=5" | jq '.data[0] // .message' || echo "Drug search failed"
echo ""

echo "=== Tests Complete ==="
