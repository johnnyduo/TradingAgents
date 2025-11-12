# Supabase Database Setup Guide

## Why Supabase?

✅ **No Local Installation**: No PostgreSQL setup needed on your machine  
✅ **Free Tier**: 500MB database, 2GB bandwidth, unlimited API requests  
✅ **Cloud-Based**: Access from anywhere  
✅ **Built-in Tools**: Dashboard, SQL editor, table viewer  
✅ **Auto Backups**: Daily backups with 7-day retention  
✅ **Production Ready**: Easy upgrade path when needed  

## Step-by-Step Setup

### 1. Create Supabase Account (2 minutes)

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with:
   - GitHub account (recommended, faster)
   - Or email + password

### 2. Create New Project (3 minutes)

1. Click **"New Project"**
2. Fill in details:
   - **Name**: `tradingagents` (or any name you like)
   - **Database Password**: Create a strong password
     - ⚠️ **SAVE THIS PASSWORD!** You'll need it for connection strings
     - Example: `MyStr0ng!Pass2024`
   - **Region**: Choose closest to you
     - US West (Oregon)
     - US East (N. Virginia)
     - Europe (Frankfurt)
     - Asia Pacific (Singapore)
     - etc.
   - **Pricing Plan**: Free (default)

3. Click **"Create new project"**
4. ⏰ Wait 2-3 minutes while Supabase sets up your database

### 3. Get Connection Strings (1 minute)

Once your project is ready:

1. Click **Settings** (gear icon) in the left sidebar
2. Go to **Database** section
3. Scroll down to **Connection string**

You'll see several options. You need **TWO** URLs:

#### A. DATABASE_URL (Transaction Pooler)
- Select **"Transaction"** mode
- Copy the entire connection string
- It looks like:
  ```
  postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
- **Replace `[YOUR-PASSWORD]`** with your actual database password

#### B. DIRECT_URL (Session Pooler)
- Select **"Session"** mode
- Copy the entire connection string
- It looks like:
  ```
  postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
  ```
- **Replace `[YOUR-PASSWORD]`** with your actual database password

### 4. Add to .env File

1. Open the `.env` file in your TradingAgents project
2. Replace the placeholder values:

```bash
# Before (example placeholders):
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# After (your actual values):
DATABASE_URL="postgresql://postgres.abcdefghijk:MyStr0ng!Pass2024@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.abcdefghijk:MyStr0ng!Pass2024@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

### 5. Run Setup Script

```bash
./setup.sh
```

This will:
- ✅ Generate Prisma client
- ✅ Push database schema to Supabase
- ✅ Create all necessary tables

### 6. Verify Setup

Check in Supabase Dashboard:
1. Go to **Table Editor** in left sidebar
2. You should see these tables:
   - `User`
   - `Account`
   - `Session`
   - `VerificationToken`
   - `UserConfig`
   - `AnalysisResult`

## Using Supabase Dashboard

### View Data
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Table Editor**
4. Browse, filter, and edit data with a nice GUI

### Run SQL Queries
1. Click **SQL Editor** in left sidebar
2. Write custom SQL queries
3. Save queries for reuse

### Monitor Database
1. Click **Database** > **Reports**
2. See:
   - Connection count
   - Query performance
   - Database size
   - API usage

## Troubleshooting

### Can't connect to database
- ✅ Check your project isn't paused (free tier pauses after 7 days of inactivity)
- ✅ Verify password in connection string is correct
- ✅ Make sure you used **Transaction** pooler for DATABASE_URL
- ✅ Make sure you used **Session** pooler for DIRECT_URL

### Project paused
Free tier projects auto-pause after 7 days of no activity:
1. Go to Supabase Dashboard
2. Click **"Resume project"** button
3. Wait 1-2 minutes

### Need to reset password
1. Go to **Settings** > **Database**
2. Click **"Reset database password"**
3. Copy new password
4. Update `.env` file with new password

### Database full (500MB limit on free tier)
- Check usage: Dashboard > Database > Reports
- Clear old analysis results:
  ```sql
  DELETE FROM "AnalysisResult" WHERE "createdAt" < NOW() - INTERVAL '30 days';
  ```
- Upgrade to Pro plan ($25/month for 8GB)

## Supabase Features You Get

### Included in Free Tier
- ✅ 500 MB database space
- ✅ 2 GB bandwidth per month
- ✅ Unlimited API requests
- ✅ 50,000 monthly active users
- ✅ Daily backups (7-day retention)
- ✅ Community support

### Available Anytime
- ✅ Real-time subscriptions
- ✅ Row-level security (RLS)
- ✅ Built-in auth system
- ✅ Storage for files
- ✅ Edge functions
- ✅ Auto-generated APIs

## Next Steps

After Supabase is set up:

1. **Add API Keys** to `.env`:
   ```bash
   OPENAI_API_KEY="sk-proj-..."
   ALPHA_VANTAGE_API_KEY="YOUR_KEY_HERE"
   ```

2. **Start Development**:
   ```bash
   pnpm dev
   ```

3. **Test the App**:
   - Open http://localhost:3000
   - Enter a stock ticker (e.g., AAPL)
   - Click "Start Analysis"

4. **View Results in Supabase**:
   - Go to Table Editor > `AnalysisResult`
   - See your analysis stored in the cloud!

## Resources

- 📚 [Supabase Docs](https://supabase.com/docs)
- 🎓 [Prisma + Supabase Guide](https://supabase.com/docs/guides/integrations/prisma)
- 💬 [Supabase Discord](https://discord.supabase.com/)
- 🐛 [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)

---

**That's it!** No PostgreSQL installation needed. Your database is in the cloud and ready to use. 🚀
