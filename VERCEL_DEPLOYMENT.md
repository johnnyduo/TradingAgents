# Vercel Serverless Deployment Guide

## Overview
This project is configured for serverless deployment on Vercel with the following architecture:
- **Frontend**: Next.js 14 (apps/web)
- **Backend**: Vercel Serverless Functions (apps/api/api)
- **Database**: Supabase PostgreSQL (serverless-compatible)
- **No WebSocket**: Uses polling for status updates

## Environment Variables

Configure these in your Vercel project settings:

### Required Variables
```bash
# OpenAI API Key (for LangChain agents)
OPENAI_API_KEY=sk-...

# Alpha Vantage API Key (for market data)
ALPHA_VANTAGE_API_KEY=your_key_here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
DATABASE_URL=postgresql://user:pass@host:5432/database

# JWT Secret (for authentication)
JWT_SECRET=your_secret_here

# Frontend URL (for CORS)
FRONTEND_URL=https://your-app.vercel.app

# Next.js Public API URL (set to /api for serverless)
NEXT_PUBLIC_API_URL=/api
```

## Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy from Root Directory
```bash
cd /Library/WebServer/Documents/TradingAgents
vercel --prod
```

### 4. Configure Environment Variables
Go to your Vercel dashboard:
1. Select your project
2. Go to Settings > Environment Variables
3. Add all required variables from `.env.vercel.example`

### 5. Redeploy After Setting Env Variables
```bash
vercel --prod
```

## API Endpoints (Serverless)

All endpoints are deployed as Vercel Functions:

- `POST /api/v1/analysis/start` - Start new analysis
- `GET /api/v1/analysis/[id]` - Get analysis result
- `GET /api/v1/analysis/[id]/status` - Get analysis status
- `GET /api/v1/analysis/[id]/result` - Get full analysis result
- `GET /api/v1/analysis/history` - Get analysis history
- `GET /api/health` - Health check

## Key Changes for Serverless

### 1. Removed WebSocket
- ❌ WebSocket is not supported in serverless
- ✅ Frontend uses polling (every 2 seconds) to check status

### 2. Background Execution
The analysis runs in the background using a fire-and-forget pattern:
```typescript
executeAnalysisAsync(analysisId, ticker, date, config);
// Returns immediately with analysisId
```

### 3. Timeout Handling
- Vercel serverless functions have a 300-second (5 min) maximum execution time
- Long-running analyses may timeout - consider:
  - Using Vercel Pro plan (longer timeouts)
  - Implementing a job queue (e.g., Vercel Queue, Inngest)
  - Breaking analysis into smaller steps

### 4. Cold Starts
- First request may take longer (cold start)
- Subsequent requests are faster (warm instances)
- Consider keeping functions warm with scheduled pings

## Local Development

Test serverless functions locally:

```bash
# Install dependencies
cd apps/api
npm install

# Run Vercel dev server
vercel dev

# Or use Next.js dev server
cd ../web
npm run dev
```

## Monitoring

- **Vercel Dashboard**: View function logs and performance
- **Supabase Dashboard**: Monitor database queries
- **Logs**: Check Vercel function logs for errors

## Limitations

1. **Execution Time**: 300s max per function (5 min)
2. **Memory**: 1024 MB default (configurable in vercel.json)
3. **Cold Starts**: Initial requests may be slower
4. **No Persistent State**: Each function is stateless
5. **No WebSocket**: Real-time updates not available

## Troubleshooting

### Analysis Times Out
- Check Vercel function logs
- Ensure API keys are set correctly
- Consider upgrading to Vercel Pro for longer timeouts

### CORS Errors
- Verify `FRONTEND_URL` environment variable
- Check CORS headers in API endpoints

### Database Connection Issues
- Verify Supabase credentials
- Check DATABASE_URL format
- Ensure Supabase project is not paused

### Import Errors
- Ensure all dependencies are in `package.json`
- Run `npm install` in both apps/web and apps/api
- Check that @vercel/node is installed

## Performance Optimization

1. **Cache Static Data**: Use Vercel Edge Config for frequently accessed data
2. **Optimize Bundle Size**: Remove unused dependencies
3. **Database Indexes**: Ensure proper indexes on AnalysisResult table
4. **Connection Pooling**: Supabase handles this automatically

## Support

For issues specific to:
- **Vercel**: https://vercel.com/docs
- **Supabase**: https://supabase.com/docs
- **Next.js**: https://nextjs.org/docs
