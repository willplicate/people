# Life Coach MVP - Vercel Deployment Test

Minimal Next.js app to test Vercel deployment before full Life Coach migration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.local.example .env.local
```

3. Edit `.env.local` with your Supabase credentials

4. Run locally:
```bash
npm run dev
```

Visit http://localhost:3001

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## What it tests

- ✅ Next.js builds on Vercel
- ✅ Environment variables work
- ✅ Supabase connection works
- ✅ API routes work
