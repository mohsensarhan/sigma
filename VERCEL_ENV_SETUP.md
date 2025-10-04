# URGENT: Vercel Environment Variables Setup

Your Vercel deployment is failing because environment variables are missing.

## Quick Fix - Add to Vercel Dashboard:

1. Go to: https://vercel.com/your-project/settings/environment-variables

2. Add these variables (copy values from .env.local):

```
VITE_SUPABASE_URL=https://sdmjetiogbvgzqsvcuth.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTA4ODcsImV4cCI6MjA3NTEyNjg4N30.EKAt4imuEHXdhNsnVTkp2JWnX09jPXXD96WZeE9GyGY
VITE_MAPBOX_TOKEN=pk.eyJ1IjoibW9oc2Vuc2FyaGFuIiwiYSI6ImNtZnliaWFpeTBpdTUyanNieGdydXRjMmUifQ.W14WRrNn17S-bCR6nEK8Yg
VITE_APP_NAME=TruPath
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Egyptian Food Bank Donation Journey Tracker
```

3. Set environment: **Production, Preview, Development** (all 3)

4. Save and redeploy

## OR Use Vercel CLI:

```bash
vercel env add VITE_SUPABASE_URL
# Paste: https://sdmjetiogbvgzqsvcuth.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTA4ODcsImV4cCI6MjA3NTEyNjg4N30.EKAt4imuEHXdhNsnVTkp2JWnX09jPXXD96WZeE9GyGY

vercel env add VITE_MAPBOX_TOKEN
# Paste: pk.eyJ1IjoibW9oc2Vuc2FyaGFuIiwiYSI6ImNtZnliaWFpeTBpdTUyanNieGdydXRjMmUifQ.W14WRrNn17S-bCR6nEK8Yg

vercel --prod
```

After adding variables, trigger a new deployment.
