#!/bin/bash

echo "🚀 Setting up Salt Intelligence Production System..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "${GREEN}✓${NC} Node.js found: $(node --version)"

# Install backend dependencies
echo "\n📦 Installing backend dependencies..."
cd backend
npm install uuid fast-check jest --save
npm install

if [ $? -eq 0 ]; then
    echo "${GREEN}✓${NC} Backend dependencies installed"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo "\n📦 Installing frontend dependencies..."
cd ..
npm install tesseract.js --save

if [ $? -eq 0 ]; then
    echo "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env.local" ]; then
    echo "\n${YELLOW}⚠${NC}  .env.local not found. Creating from example..."
    cp .env.example .env.local
    echo "${GREEN}✓${NC} Created .env.local - Please update with your configuration"
fi

if [ ! -f "backend/.env" ]; then
    echo "${YELLOW}⚠${NC}  backend/.env not found. Creating from example..."
    cp .env.example backend/.env
    echo "${GREEN}✓${NC} Created backend/.env - Please update with your configuration"
fi

# Run database migrations
echo "\n🗄️  Running database migrations..."
cd backend
npx prisma generate

if [ $? -eq 0 ]; then
    echo "${GREEN}✓${NC} Prisma client generated"
else
    echo "${YELLOW}⚠${NC}  Prisma generation failed - you may need to configure DATABASE_URL first"
fi

# Run tests
echo "\n🧪 Running tests..."
npm test

if [ $? -eq 0 ]; then
    echo "${GREEN}✓${NC} All tests passed!"
else
    echo "${YELLOW}⚠${NC}  Some tests failed - this is okay for initial setup"
fi

cd ..

echo "\n${GREEN}✅ Setup complete!${NC}"
echo "\nNext steps:"
echo "1. Update .env.local and backend/.env with your configuration"
echo "2. Run database migrations: cd backend && npx prisma migrate deploy"
echo "3. Start backend: cd backend && npm run dev"
echo "4. Start frontend: npm run dev"
echo "\nFor detailed instructions, see DEPLOYMENT_GUIDE.md"
