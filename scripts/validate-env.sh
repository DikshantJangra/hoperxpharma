#!/bin/bash

# HopeRxPharma - Environment Variables Validation Script
# Version: 1.0
# Purpose: Validate all required environment variables before deployment

set -e

echo "🔍 HopeRxPharma - Environment Validation"
echo "========================================"
echo ""

ERRORS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if variable exists and is not empty
check_var() {
    local var_name=$1
    local file_path=$2
    local min_length=${3:-1}
    
    if grep -q "^${var_name}=" "$file_path" 2>/dev/null; then
        local value=$(grep "^${var_name}=" "$file_path" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
        if [ -n "$value" ] && [ ${#value} -ge $min_length ]; then
            echo -e "${GREEN}✓${NC} $var_name (${#value} chars)"
            return 0
        else
            echo -e "${RED}✗${NC} $var_name is too short (min: $min_length chars)"
            ((ERRORS++))
            return 1
        fi
    else
        echo -e "${RED}✗${NC} $var_name is missing"
        ((ERRORS++))
        return 1
    fi
}

# Check backend environment
echo "Checking Backend Environment..."
echo "--------------------------------"

BACKEND_ENV="backend/.env"

if [ ! -f "$BACKEND_ENV" ]; then
    echo -e "${RED}✗${NC} Backend .env file not found!"
    exit 1
fi

# Required variables with minimum lengths
check_var "NODE_ENV" "$BACKEND_ENV"
check_var "PORT" "$BACKEND_ENV"
check_var "DATABASE_URL" "$BACKEND_ENV" 20
check_var "DIRECT_URL" "$BACKEND_ENV" 20
check_var "JWT_SECRET" "$BACKEND_ENV" 32
check_var "JWT_REFRESH_SECRET" "$BACKEND_ENV" 32
check_var "WHATSAPP_ENCRYPTION_KEY" "$BACKEND_ENV" 32
check_var "SMTP_ENCRYPTION_KEY" "$BACKEND_ENV" 32
check_var "COOKIE_SECURE" "$BACKEND_ENV"
check_var "ALLOWED_ORIGINS" "$BACKEND_ENV"
check_var "SESSION_TIMEOUT_MINUTES" "$BACKEND_ENV"

# Check DATABASE_URL contains sslmode=require
if grep -q "sslmode=require" "$BACKEND_ENV"; then
    echo -e "${GREEN}✓${NC} Database SSL mode verified"
else
    echo -e "${YELLOW}⚠${NC} Warning: DATABASE_URL should include ?sslmode=require"
fi

# Check if NODE_ENV is production
if grep -q "NODE_ENV=production" "$BACKEND_ENV"; then
    echo -e "${GREEN}✓${NC} Production environment confirmed"
    
    # Additional production checks
    if grep -q "COOKIE_SECURE=true" "$BACKEND_ENV"; then
        echo -e "${GREEN}✓${NC} Secure cookies enabled"
    else
        echo -e "${RED}✗${NC} COOKIE_SECURE must be true in production"
        ((ERRORS++))
    fi
fi

echo ""
echo "Checking Frontend Environment..."
echo "--------------------------------"

FRONTEND_ENV=".env.production"

if [ ! -f "$FRONTEND_ENV" ]; then
    echo -e "${YELLOW}⚠${NC} Frontend .env.production not found (using .env.local if present)"
    FRONTEND_ENV=".env.local"
fi

if [ -f "$FRONTEND_ENV" ]; then
    check_var "NEXT_PUBLIC_API_URL" "$FRONTEND_ENV" 10
    
    # Check if API URL uses HTTPS in production
    if grep -q "NEXT_PUBLIC_API_URL=https://" "$FRONTEND_ENV"; then
        echo -e "${GREEN}✓${NC} HTTPS API URL configured"
    else
        echo -e "${YELLOW}⚠${NC} Warning: API URL should use HTTPS in production"
    fi
else
    echo -e "${RED}✗${NC} No frontend environment file found"
    ((ERRORS++))
fi

echo ""
echo "========================================"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All environment variables validated successfully!${NC}"
    echo ""
    echo "Your application is ready for deployment."
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS error(s) in environment configuration${NC}"
    echo ""
    echo "Please fix the issues above before deploying."
    exit 1
fi
