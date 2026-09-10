# Costing Dashboard - Deployment Guide

## Quick Start (Local)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Update `.env.local` with your RDS credentials:**
   ```
   RDS_HOST=your-rds-host
   RDS_PORT=5432
   RDS_DATABASE=your-db
   RDS_USER=your-user
   RDS_PASSWORD=your-password
   RDS_SSL=true
   ```

3. **Run locally:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 in your browser.

---

## Deploy to Vercel (Free)

### Option 1: Deploy from GitHub (Easiest)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/costing-dashboard.git
   git branch -M main
   git push -u origin main
   ```

2. **On Vercel (vercel.com):**
   - Click "New Project"
   - Select your GitHub repo
   - Add environment variables in "Environment Variables":
     - `RDS_HOST`
     - `RDS_PORT`
     - `RDS_DATABASE`
     - `RDS_USER`
     - `RDS_PASSWORD`
     - `RDS_SSL=true`
   - Click "Deploy"

3. **Done!** Your dashboard is live at `https://your-project.vercel.app`

### Option 2: Deploy via CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variables when prompted**

---

## Share with Stakeholders

Once deployed, simply share the Vercel URL:
```
https://your-project.vercel.app
```

Everyone can access it. Changes you make:
- Push to GitHub
- Vercel auto-deploys (1-2 minutes)
- Link always shows latest version

---

## Important Notes

- **Keep `.env.local` secret** — don't push to GitHub
- Vercel environment variables override `.env.local`
- RDS must allow inbound connections from Vercel IPs
- Free Vercel tier: unlimited projects, 100GB bandwidth/month

---

## Troubleshooting

**"Connection refused"** → RDS security group doesn't allow Vercel IPs
**"env variable missing"** → Set all RDS_* vars in Vercel dashboard
**"Dashboard loads but no data"** → Check `/api/costing` response in browser dev tools
