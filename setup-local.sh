#!/bin/bash

# TradingAgents Setup Script
echo "🚀 TradingAgents Setup"
echo "====================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Please create one from .env.example"
    echo "   cp .env.example .env"
    echo "   Then edit .env with your API keys"
    exit 1
fi

# Check if PostgreSQL is running
echo ""
echo "📦 Checking PostgreSQL..."
if ! pg_isready > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL is not running"
    echo "   Start it with: brew services start postgresql@14"
    exit 1
fi
echo "✅ PostgreSQL is running"

# Check if database exists
echo ""
echo "📦 Checking database..."
if ! psql -lqt | cut -d \| -f 1 | grep -qw tradingagents_dev; then
    echo "📝 Creating database tradingagents_dev..."
    createdb tradingagents_dev
    echo "✅ Database created"
else
    echo "✅ Database exists"
fi

# Generate Prisma client and push schema
echo ""
echo "📦 Setting up Prisma..."
cd apps/api
pnpm prisma generate
pnpm prisma db push --accept-data-loss
cd ../..
echo "✅ Prisma setup complete"

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  pnpm dev"
echo ""
echo "Then open:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo ""
