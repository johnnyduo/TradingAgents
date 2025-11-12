# 🚀 TradingAgents Quick Reference

## ✅ What's Changed

**Before:** Required local PostgreSQL installation  
**Now:** Uses Supabase cloud database (free, no installation needed!)

## 🎯 What You Need

### 1. Supabase Account (Free)
- **Sign up**: https://supabase.com
- **Create project**: Takes 2-3 minutes
- **Get 2 connection strings**:
  - `DATABASE_URL` (Transaction pooler)
  - `DIRECT_URL` (Session pooler)

### 2. API Keys
- **OpenAI**: https://platform.openai.com/api-keys
- **Alpha Vantage**: https://www.alphavantage.co/support/#api-key (free)

## 📝 Setup Checklist

- [ ] Create Supabase project
- [ ] Copy connection strings to `.env`
- [ ] Add `OPENAI_API_KEY` to `.env`
- [ ] Add `ALPHA_VANTAGE_API_KEY` to `.env`
- [ ] Run `./setup.sh`
- [ ] Run `pnpm dev`
- [ ] Test at http://localhost:3000

## 🔧 Essential Commands

```bash
# Check what's missing
./check-status.sh

# Set up database schema
./setup.sh

# Start development servers
pnpm dev

# View database
cd apps/api && pnpm prisma studio

# View logs
tail -f apps/api/logs/combined.log
```

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| `SUPABASE_SETUP.md` | Step-by-step Supabase setup with screenshots guide |
| `DEVELOPMENT.md` | Complete development guide with troubleshooting |
| `.env.example` | Template with all required variables |

## 🏃 Quick Start (5 minutes)

1. **Install dependencies** (if not done):
   ```bash
   pnpm install
   ```

2. **Set up Supabase**:
   - Go to https://supabase.com
   - Create project (free tier)
   - Copy 2 connection strings

3. **Configure `.env`**:
   ```bash
   DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@...pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.xxx:[PASSWORD]@...pooler.supabase.com:5432/postgres"
   OPENAI_API_KEY="sk-proj-..."
   ALPHA_VANTAGE_API_KEY="YOUR_KEY"
   ```

4. **Initialize database**:
   ```bash
   ./setup.sh
   ```

5. **Start app**:
   ```bash
   pnpm dev
   ```

6. **Test**: Open http://localhost:3000, enter "AAPL", click Start Analysis

## 💡 Tips

- **Free tier limits**:
  - Supabase: 500MB database, 2GB bandwidth/month
  - Alpha Vantage: 5 calls/min, 100 calls/day
  - OpenAI: Pay-as-you-go (~$0.03 per analysis)

- **Supabase pauses after 7 days** of inactivity on free tier
  - Just click "Resume project" in dashboard

- **View your data**: https://supabase.com/dashboard > Table Editor

- **All logs**: `apps/api/logs/combined.log`

## ❓ Common Issues

**"DATABASE_URL not configured"**
→ Update `.env` with Supabase connection strings

**"Prisma client not generated"**
→ Run `./setup.sh`

**"Analysis fails"**
→ Check API keys are valid
→ View logs: `tail -f apps/api/logs/error.log`

**"Backend won't start"**
→ Run `./check-status.sh` to diagnose
→ Check Supabase project isn't paused

## 🎓 Learn More

- Supabase Docs: https://supabase.com/docs
- Prisma Docs: https://www.prisma.io/docs
- LangChain.js: https://js.langchain.com/docs
- Alpha Vantage API: https://www.alphavantage.co/documentation

---

**Need help?** Check `SUPABASE_SETUP.md` for detailed Supabase guide or `DEVELOPMENT.md` for full documentation.
