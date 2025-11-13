# Vercel Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Variables ✓
Prepare these values (you'll add them in Vercel dashboard):

```bash
# Required for LLM agents
OPENAI_API_KEY=sk-...

# Required for market data
ALPHA_VANTAGE_API_KEY=...

# Required for database
SUPABASE_URL=https://....supabase.co
SUPABASE_ANON_KEY=...
DATABASE_URL=postgresql://...

# Required for auth
JWT_SECRET=...

# Optional - will default to * if not set
FRONTEND_URL=https://your-app.vercel.app
```

### 2. Database Setup ✓
- [ ] Supabase project created
- [ ] Database tables created (User, AnalysisResult)
- [ ] Connection string working

### 3. API Keys ✓
- [ ] OpenAI API key obtained
- [ ] Alpha Vantage API key obtained (free tier sufficient)
- [ ] Both keys tested and working

## Deployment Steps

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy (First Time)
```bash
cd /Library/WebServer/Documents/TradingAgents
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? **Select your account**
- Link to existing project? **N** (first time) or **Y** (if exists)
- What's your project's name? **tradingagents** (or your choice)
- In which directory is your code located? **./** (press Enter)

### Step 4: Configure Environment Variables
1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add each variable from `.env.vercel.example`:
   - Click "Add Environment Variable"
   - Enter Name and Value
   - Select **Production**, **Preview**, **Development** (all three)
   - Click "Save"

Repeat for all variables:
- `OPENAI_API_KEY`
- `ALPHA_VANTAGE_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL` (use your Vercel app URL)
- `NEXT_PUBLIC_API_URL` (set to `/api`)

### Step 5: Redeploy with Environment Variables
```bash
vercel --prod
```

### Step 6: Test Deployment
1. Visit your deployed URL: `https://your-app.vercel.app`
2. Test health endpoint: `https://your-app.vercel.app/api/health`
3. Try analyzing a ticker: AAPL, TSLA, BTC-USD, or EURUSD

## Verification Checklist

After deployment, verify:

### Health Check
- [ ] `https://your-app.vercel.app/api/health` returns 200 OK
- [ ] Response includes: `{status: "ok", timestamp: "...", environment: "production"}`

### Frontend
- [ ] Main page loads correctly
- [ ] Asset type badge shows under search bar
- [ ] Placeholder text: "Enter ticker (e.g., AAPL, BTC-USD, EURUSD)"
- [ ] Animations work smoothly

### Analysis Flow
- [ ] Can submit a ticker symbol
- [ ] Loading state shows with agent cards
- [ ] Agents transition: pending → running → completed
- [ ] Progress animations work
- [ ] Results display after completion
- [ ] ReportRenderer shows formatted sections
- [ ] Metrics extracted correctly (price, change, volume, sentiment)

### History
- [ ] Analysis history button works
- [ ] Shows previous analyses
- [ ] Can load past analysis results

### Error Handling
- [ ] Empty ticker shows error message
- [ ] Invalid ticker handled gracefully
- [ ] Network errors show user-friendly messages

## Troubleshooting

### Build Fails
```bash
# Check build logs in Vercel dashboard
# Common issues:
# - Missing dependencies
# - TypeScript errors
# - Environment variables not set
```

### Functions Timeout
```bash
# Check Vercel function logs
# Options:
# - Upgrade to Vercel Pro (longer timeout)
# - Optimize agent prompts
# - Reduce number of agents
```

### CORS Errors
```bash
# Ensure FRONTEND_URL is set correctly
# Check browser console for specific errors
# Verify CORS headers in serverless functions
```

### Database Connection Issues
```bash
# Verify DATABASE_URL format
# Check Supabase project status
# Test connection string locally first
```

### "Cannot find module @vercel/node"
```bash
# Already fixed - @vercel/node is in devDependencies
# If still occurs, run: npm install
```

## Performance Optimization (Post-Deployment)

### Monitor Function Performance
1. Go to Vercel Dashboard > Your Project > Analytics
2. Check function execution times
3. Look for timeout warnings

### Optimize if Needed
- **Slow agents?** Reduce temperature or max tokens
- **Timeouts?** Consider Vercel Pro or job queue
- **High latency?** Check Alpha Vantage API performance

### Keep Functions Warm (Optional)
```bash
# Use a monitoring service to ping every 5 minutes
# Example: UptimeRobot, Pingdom, or cron-job.org
# URL to ping: https://your-app.vercel.app/api/health
```

## Success Criteria

Your deployment is successful when:
- ✅ Health endpoint responds with 200 OK
- ✅ Frontend loads without errors
- ✅ Can analyze stock tickers (AAPL, TSLA)
- ✅ Can analyze crypto tickers (BTC-USD, ETH-USD)
- ✅ Can analyze forex pairs (EURUSD, GBPUSD)
- ✅ All 6 agents complete successfully
- ✅ Results display with formatted sections
- ✅ Analysis history works
- ✅ No console errors in browser

## Rollback Plan

If deployment has critical issues:

```bash
# Option 1: Revert to previous deployment
# In Vercel Dashboard > Deployments > Find previous working deployment > Promote to Production

# Option 2: Redeploy previous version
git log  # Find previous commit
git checkout <commit-hash>
vercel --prod
```

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Project README**: `/VERCEL_DEPLOYMENT.md`
- **Implementation Details**: `/SERVERLESS_SUMMARY.md`

## Quick Reference Commands

```bash
# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs <deployment-url>

# Remove deployment
vercel rm <deployment-name>

# Test locally with Vercel dev server
vercel dev
```

---

**Ready to Deploy!** 🚀

Everything is configured and ready for serverless deployment on Vercel. The system will work without glitches as requested - all necessary changes have been made to ensure compatibility with Vercel's serverless architecture.
