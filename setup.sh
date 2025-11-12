#!/bin/bash
set -e

echo "🚀 TradingAgents Setup Script (Supabase Edition)"
echo "================================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "⚠️  No .env file found!"
  echo "📝 Creating .env from .env.example..."
  cp .env.example .env
  echo "✅ .env file created"
  echo ""
  echo "⚠️  IMPORTANT: You need to configure:"
  echo ""
  echo "1. Create a Supabase project (free tier):"
  echo "   - Go to https://supabase.com"
  echo "   - Sign up and create a new project"
  echo "   - Wait 2-3 minutes for setup to complete"
  echo ""
  echo "2. Get your database connection strings:"
  echo "   - Go to Project Settings > Database"
  echo "   - Copy 'Connection string' under 'Transaction pooler'"
  echo "   - Copy 'Connection string' under 'Session pooler' for DIRECT_URL"
  echo ""
  echo "3. Add to .env file:"
  echo "   - DATABASE_URL (transaction pooler URL)"
  echo "   - DIRECT_URL (session pooler URL)"
  echo "   - OPENAI_API_KEY"
  echo "   - ALPHA_VANTAGE_API_KEY"
  echo ""
  read -p "Press Enter after you've configured .env..."
else
  echo "✅ .env file exists"
fi

echo ""

# Check if DATABASE_URL is configured
if grep -q "PROJECT-REF" .env 2>/dev/null || ! grep -q "DATABASE_URL=" .env; then
  echo "⚠️  DATABASE_URL not properly configured in .env"
  echo ""
  echo "Please add your Supabase connection strings:"
  echo "  1. Go to https://supabase.com > Your Project"
  echo "  2. Settings > Database > Connection string"
  echo "  3. Copy both Transaction and Session pooler URLs"
  echo "  4. Update .env file with both URLs"
  echo ""
  exit 1
fi

echo "✅ Database connection configured"

echo ""
echo "🔧 Setting up Prisma..."
echo ""

# Navigate to API directory
cd apps/api

# Generate Prisma client
echo "📦 Generating Prisma client..."
pnpm prisma generate

# Push schema to database
echo "📤 Pushing schema to Supabase..."
pnpm prisma db push

cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 You can view your database:"
echo "   - Supabase Dashboard: https://supabase.com/dashboard"
echo "   - Prisma Studio: cd apps/api && pnpm prisma studio"
echo ""
echo "Next steps:"
echo "  1. Run: pnpm dev"
echo "  2. Open: http://localhost:3000"
echo "  3. Test with a stock ticker (e.g., AAPL)"
echo ""
