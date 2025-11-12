#!/bin/bash
set -e

echo "🔍 TradingAgents System Status Check"
echo "===================================="
echo ""

# Check Node.js
echo "📦 Node.js:"
if command -v node &> /dev/null; then
  echo "  ✅ $(node --version)"
else
  echo "  ❌ Not installed"
fi

# Check pnpm
echo "📦 pnpm:"
if command -v pnpm &> /dev/null; then
  echo "  ✅ $(pnpm --version)"
else
  echo "  ❌ Not installed (run: npm install -g pnpm)"
fi

# Check .env file
echo "⚙️  Configuration:"
if [ -f ".env" ]; then
  echo "  ✅ .env file exists"
  
  # Check DATABASE_URL
  if grep -q "DATABASE_URL=" .env && ! grep -q "PROJECT-REF" .env 2>/dev/null; then
    echo "  ✅ DATABASE_URL configured (Supabase)"
  else
    echo "  ⚠️  DATABASE_URL not configured"
    echo "      Get from: https://supabase.com > Project Settings > Database"
  fi
  
  # Check DIRECT_URL
  if grep -q "DIRECT_URL=" .env && ! grep -q "PROJECT-REF" .env 2>/dev/null; then
    echo "  ✅ DIRECT_URL configured"
  else
    echo "  ⚠️  DIRECT_URL not configured"
  fi
  
  # Check API keys
  if grep -q "OPENAI_API_KEY=\"sk-" .env 2>/dev/null; then
    echo "  ✅ OpenAI API key configured"
  else
    echo "  ⚠️  OpenAI API key missing"
    echo "      Get from: https://platform.openai.com/api-keys"
  fi
  
  if grep -q "ALPHA_VANTAGE_API_KEY=" .env | grep -v '""' &> /dev/null; then
    echo "  ✅ Alpha Vantage API key configured"
  else
    echo "  ⚠️  Alpha Vantage API key missing"
    echo "      Get from: https://www.alphavantage.co/support/#api-key"
  fi
else
  echo "  ❌ .env file missing (copy from .env.example)"
fi

# Check dependencies
echo "📚 Dependencies:"
if [ -d "node_modules" ]; then
  echo "  ✅ node_modules exists"
else
  echo "  ⚠️  Dependencies not installed (run: pnpm install)"
fi

# Check Prisma client
echo "🔧 Prisma:"
if [ -d "apps/api/node_modules/.prisma" ] || [ -d "apps/api/node_modules/@prisma" ]; then
  echo "  ✅ Prisma client generated"
else
  echo "  ⚠️  Prisma client not generated (run: ./setup.sh)"
fi

# Check ports
echo "🔌 Ports:"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo "  ⚠️  Port 3000 in use (frontend may already be running)"
else
  echo "  ✅ Port 3000 available"
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo "  ⚠️  Port 3001 in use (backend may already be running)"
else
  echo "  ✅ Port 3001 available"
fi

echo ""
echo "===================================="
echo "📋 Next Steps:"
echo ""

NEEDS_SETUP=false

if ! command -v pnpm &> /dev/null; then
  echo "  1. Install pnpm: npm install -g pnpm"
  NEEDS_SETUP=true
fi

if [ ! -f ".env" ]; then
  echo "  2. Copy .env.example to .env: cp .env.example .env"
  NEEDS_SETUP=true
fi

if grep -q "PROJECT-REF" .env 2>/dev/null || ! grep -q "DATABASE_URL=" .env 2>/dev/null; then
  echo "  3. Set up Supabase database:"
  echo "     - Go to https://supabase.com and create a project"
  echo "     - Get connection strings from Project Settings > Database"
  echo "     - Add DATABASE_URL and DIRECT_URL to .env"
  NEEDS_SETUP=true
fi

if ! grep -q "OPENAI_API_KEY=\"sk-" .env 2>/dev/null; then
  echo "  4. Add OPENAI_API_KEY to .env"
  NEEDS_SETUP=true
fi

if ! grep -q "ALPHA_VANTAGE_API_KEY=" .env 2>/dev/null || grep -q "ALPHA_VANTAGE_API_KEY=\"\"" .env 2>/dev/null; then
  echo "  5. Add ALPHA_VANTAGE_API_KEY to .env"
  NEEDS_SETUP=true
fi

if [ ! -d "node_modules" ]; then
  echo "  6. Install dependencies: pnpm install"
  NEEDS_SETUP=true
fi

if [ ! -d "apps/api/node_modules/.prisma" ] && [ ! -d "apps/api/node_modules/@prisma" ]; then
  echo "  7. Run setup: ./setup.sh"
  NEEDS_SETUP=true
fi

if [ "$NEEDS_SETUP" = false ]; then
  echo "  ✅ All set! Ready to run."
  echo ""
  echo "  ✨ Start development: pnpm dev"
else
  echo ""
  echo "  ✨ After setup, start with: pnpm dev"
fi

echo ""
echo "📖 For detailed instructions, see DEVELOPMENT.md"
echo ""
