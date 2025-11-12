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

# Check PostgreSQL
echo "🗄️  PostgreSQL:"
if command -v psql &> /dev/null; then
  if pg_isready &> /dev/null; then
    echo "  ✅ Running ($(psql --version | head -n1))"
  else
    echo "  ⚠️  Installed but not running (start: brew services start postgresql@14)"
  fi
else
  echo "  ❌ Not installed"
fi

# Check .env file
echo "⚙️  Configuration:"
if [ -f ".env" ]; then
  echo "  ✅ .env file exists"
  if grep -q "OPENAI_API_KEY=\"sk-" .env 2>/dev/null; then
    echo "  ✅ OpenAI API key configured"
  else
    echo "  ⚠️  OpenAI API key missing or placeholder"
  fi
  if grep -q "ALPHA_VANTAGE_API_KEY=" .env | grep -v '""' 2>/dev/null; then
    echo "  ✅ Alpha Vantage API key configured"
  else
    echo "  ⚠️  Alpha Vantage API key missing"
  fi
else
  echo "  ❌ .env file missing (copy from .env.example)"
fi

# Check database
echo "💾 Database:"
if command -v psql &> /dev/null && pg_isready &> /dev/null; then
  if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw tradingagents_dev; then
    echo "  ✅ tradingagents_dev database exists"
  else
    echo "  ⚠️  Database not created (run: ./setup.sh)"
  fi
else
  echo "  ⏭️  Skipped (PostgreSQL not running)"
fi

# Check dependencies
echo "📚 Dependencies:"
if [ -d "node_modules" ]; then
  echo "  ✅ node_modules exists"
else
  echo "  ⚠️  Dependencies not installed (run: pnpm install)"
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

if ! command -v pnpm &> /dev/null; then
  echo "  1. Install pnpm: npm install -g pnpm"
fi

if ! pg_isready &> /dev/null 2>&1; then
  echo "  1. Start PostgreSQL: brew services start postgresql@14"
fi

if [ ! -f ".env" ]; then
  echo "  2. Create .env: cp .env.example .env"
  echo "  3. Add API keys to .env"
fi

if ! psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw tradingagents_dev 2>/dev/null; then
  echo "  4. Run setup: ./setup.sh"
fi

if [ ! -d "node_modules" ]; then
  echo "  5. Install dependencies: pnpm install"
fi

echo "  ✨ Start development: pnpm dev"
echo ""
