# Development Guide

## Initial Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set Up Supabase Database (Free Cloud Database)

**Why Supabase?**
- ✅ No local PostgreSQL installation needed
- ✅ Free tier with 500MB database
- ✅ Automatic backups
- ✅ Built-in dashboard and SQL editor
- ✅ Works from anywhere

**Steps:**

1. **Create Supabase Account**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up with GitHub or email (free)

2. **Create a New Project**
   - Click "New Project"
   - Choose a name (e.g., "tradingagents")
   - Set a strong database password (save it!)
   - Choose a region close to you
   - Click "Create new project"
   - Wait 2-3 minutes for setup

3. **Get Database Connection Strings**
   - Go to **Project Settings** (gear icon) > **Database**
   - Scroll to **Connection string**
   - Copy **"Transaction"** pooler URL → Use as `DATABASE_URL`
   - Copy **"Session"** pooler URL → Use as `DIRECT_URL`
   - Replace `[YOUR-PASSWORD]` with your actual database password

### 3. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add:
# 1. DATABASE_URL (from Supabase Transaction pooler)
# 2. DIRECT_URL (from Supabase Session pooler)
# 3. OPENAI_API_KEY (from https://platform.openai.com/api-keys)
# 4. ALPHA_VANTAGE_API_KEY (from https://www.alphavantage.co/support/#api-key)
```

Example `.env`:
```bash
DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
OPENAI_API_KEY="sk-proj-..."
ALPHA_VANTAGE_API_KEY="YOUR_KEY_HERE"
```

### 4. Set Up Database Schema
```bash
# Run the setup script (pushes Prisma schema to Supabase)
./setup.sh
```

### 5. Start Development Servers
```bash
# Start both frontend and backend
pnpm dev

# Or start individually:
cd apps/api && pnpm dev    # Backend on :3001
cd apps/web && pnpm dev    # Frontend on :3000
```

## Testing the System

### 1. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### 2. Run an Analysis
1. Open http://localhost:3000
2. Enter a stock ticker (e.g., AAPL, GOOGL, TSLA)
3. Click "Start Analysis"
4. Wait ~30-60 seconds for agents to complete
5. View comprehensive results

### 3. Check Logs
Backend logs are written to:
- `apps/api/logs/error.log` - Errors only
- `apps/api/logs/combined.log` - All logs

View in real-time:
```bash
tail -f apps/api/logs/combined.log
```

## Project Structure

```
apps/
├── api/                      # Express.js backend
│   ├── src/
│   │   ├── agents/           # AI trading agents
│   │   ├── tools/            # Stock data tools
│   │   ├── graph/            # LangGraph state machine
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Express middleware
│   │   └── config/           # Configuration
│   └── prisma/               # Database schema
│
└── web/                      # Next.js frontend
    ├── app/                  # Next.js 14 pages
    └── lib/                  # Utilities

packages/
└── types/                    # Shared TypeScript types
```

## API Endpoints

### Analysis
- `POST /api/v1/analysis/start` - Start new analysis
- `GET /api/v1/analysis/:id/status` - Get status
- `GET /api/v1/analysis/:id/result` - Get full result
- `POST /api/v1/analysis/:id/stop` - Stop running analysis
- `GET /api/v1/analysis/history` - Get history

### Health
- `GET /health` - Server health check

## Database Management

### View Data (3 ways)

**1. Supabase Dashboard (Recommended)**
```bash
# Go to https://supabase.com/dashboard
# Select your project > Table Editor
# View and edit data with GUI
```

**2. Prisma Studio (Local GUI)**
```bash
cd apps/api
pnpm prisma studio
# Opens at http://localhost:5555
```

**3. SQL Editor in Supabase**
```bash
# Go to Supabase Dashboard > SQL Editor
# Run custom queries
```

### Reset Database
```bash
cd apps/api
pnpm prisma db push --force-reset
# Warning: This will delete all data!
```

### Create Migration
```bash
cd apps/api
pnpm prisma migrate dev --name description
# Note: For Supabase, db push is often easier for development
```

### Backup Database
```bash
# Automatic daily backups in Supabase (free tier: 7 days retention)
# Manual backup: Supabase Dashboard > Database > Backups
```

## Common Issues

### Backend won't start
- Check .env file exists and has all required keys
- Verify DATABASE_URL and DIRECT_URL are correct
- Check Supabase project is active (not paused)
- Run `./check-status.sh` to diagnose issues

### Database connection fails
- Verify Supabase project is running (not paused after 7 days of inactivity)
- Check DATABASE_URL has correct password
- Ensure you copied the **Transaction pooler** URL for DATABASE_URL
- Ensure you copied the **Session pooler** URL for DIRECT_URL
- Check firewall isn't blocking Supabase IPs

### Frontend won't connect
- Ensure backend is running on port 3001
- Check CORS settings in `apps/api/src/index.ts`
- Check browser console for errors
- Verify `http://localhost:3001/health` returns 200

### Analysis fails
- Verify OPENAI_API_KEY is set in .env and starts with `sk-`
- Verify ALPHA_VANTAGE_API_KEY is set
- Check backend logs: `tail -f apps/api/logs/error.log`
- Test OpenAI key: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

### Prisma client errors
- Run `cd apps/api && pnpm prisma generate`
- If schema changed, run `pnpm prisma db push`
- Check DATABASE_URL format is correct

### Rate Limiting
Alpha Vantage free tier limits:
- 5 API calls per minute
- 100 calls per day

If you hit limits:
- Wait a minute and try again
- Get a premium key
- Implement caching (TODO)

### Supabase project paused
Free tier projects pause after 7 days of inactivity:
- Go to Supabase Dashboard
- Click "Resume project"
- Wait 1-2 minutes for restart

## Development Tips

### Hot Reload
Both frontend and backend support hot reload:
- Backend: tsx watch automatically restarts
- Frontend: Next.js Fast Refresh

### Type Checking
```bash
# Check all packages
pnpm type-check

# Check specific package
cd apps/api && pnpm type-check
cd apps/web && pnpm type-check
```

### Linting
```bash
# Lint all packages
pnpm lint

# Fix auto-fixable issues
pnpm lint --fix
```

### Building
```bash
# Build all packages
pnpm build

# Build specific package
cd apps/api && pnpm build
cd apps/web && pnpm build
```

## Agent Workflow

1. **Market Analyst** 📊
   - Fetches current price
   - Gets historical data (100 days)
   - Calculates SMA, RSI
   - Analyzes trends

2. **News Analyst** 📰
   - Fetches recent news (10 articles)
   - Analyzes sentiment
   - Identifies catalysts

3. **Fundamentals Analyst** 💼
   - Gets company overview
   - Analyzes financials (P/E, ROE, etc.)
   - Evaluates valuation

4. **Bull Researcher** 🐂
   - Synthesizes bullish arguments
   - Highlights opportunities

5. **Bear Researcher** 🐻
   - Builds bearish case
   - Identifies risks

6. **Trader** 💰
   - Reviews all analyses
   - Makes final BUY/SELL/HOLD decision

## Next Steps

### High Priority
- [ ] Add real-time WebSocket updates
- [ ] Implement user authentication
- [ ] Add analysis history page
- [ ] Improve error handling

### Medium Priority
- [ ] Add more technical indicators
- [ ] Implement caching layer
- [ ] Add export functionality
- [ ] Create settings page

### Low Priority
- [ ] Add charts and visualizations
- [ ] Social media analysis (Reddit)
- [ ] Multiple data vendor support
- [ ] Docker containerization

## Getting Help

- Check logs: `tail -f apps/api/logs/combined.log`
- Check database: `pnpm --filter @tradingagents/api prisma:studio`
- Check API: http://localhost:3001/health
- Check frontend: Browser DevTools console
