# Development Guide

## Initial Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API keys:
# - OPENAI_API_KEY (required for AI agents)
# - ALPHA_VANTAGE_API_KEY (required for stock data)
```

### 3. Start PostgreSQL
```bash
# macOS with Homebrew
brew services start postgresql@14

# Or use Docker
docker run --name tradingagents-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:14
```

### 4. Set Up Database
```bash
# Run the setup script
./setup.sh

# Or manually:
createdb tradingagents_dev
cd apps/api
pnpm prisma generate
pnpm prisma db push
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

## Database

### View Data
```bash
cd apps/api
pnpm prisma studio
```

### Reset Database
```bash
cd apps/api
pnpm prisma db push --force-reset
```

### Create Migration
```bash
cd apps/api
pnpm prisma migrate dev --name description
```

## Common Issues

### Backend won't start
- Check PostgreSQL is running: `pg_isready`
- Check .env file exists and has required keys
- Check database exists: `psql -l | grep tradingagents_dev`

### Frontend won't connect
- Ensure backend is running on port 3001
- Check CORS settings in `apps/api/src/index.ts`
- Check browser console for errors

### Analysis fails
- Verify OPENAI_API_KEY is set in .env
- Verify ALPHA_VANTAGE_API_KEY is set
- Check backend logs: `tail -f apps/api/logs/error.log`

### Rate Limiting
Alpha Vantage free tier limits:
- 5 API calls per minute
- 100 calls per day

If you hit limits:
- Wait a minute and try again
- Get a premium key
- Implement caching (TODO)

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
