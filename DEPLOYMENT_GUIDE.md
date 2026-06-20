# Deployment Guide

This guide walks you through deploying the Buzzer Quiz system to production using Vercel.

## Prerequisites

- [ ] GitHub account
- [ ] Vercel account (free tier)
- [ ] Supabase project set up with schema deployed
- [ ] Repository pushed to GitHub

## Step 1: Prepare Your Repository

### 1.1 Create .env.local (local development only)

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials from the Supabase dashboard.

### 1.2 Verify your build locally

```bash
npm install
npm run type-check
npm run lint
npm run build
```

All should pass without errors.

### 1.3 Push to GitHub

```bash
git add .
git commit -m "Production-ready setup"
git push origin main
```

## Step 2: Deploy on Vercel

### 2.1 Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### 2.2 Configure Environment Variables

In Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:
   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** `https://your-project-ref.supabase.co`
   - **Environments:** Production, Preview, Development
3. Add the following variable:
   - **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value:** Your anon public key from Supabase
   - **Environments:** Production, Preview, Development

### 2.3 Deploy

Click **Deploy** and wait for the build to complete.

## Step 3: Configure Supabase CORS

If you see CORS errors when accessing the app:

1. Go to Supabase Dashboard
2. **Project Settings** → **API**
3. Under **Security & CORS**, add your Vercel domain:
   - Add: `https://your-vercel-domain.vercel.app`
   - Also add: `https://your-custom-domain.com` (if using custom domain)

## Step 4: Configure Custom Domain (Optional)

### For Vercel Domains

1. Vercel provides a free domain like `buzzer-quiz.vercel.app`
2. No additional configuration needed

### For Custom Domains

1. In Vercel: **Settings** → **Domains**
2. Add your domain (e.g., `buzzer.example.com`)
3. Follow DNS instructions from Vercel
4. Update Supabase CORS settings

## Step 5: Verify Deployment

### 5.1 Test the Application

1. Open your Vercel URL in a browser
2. Test **Admin Panel**: `/admin`
   - Add a test team
   - Add a test question
   - Test all buttons
3. Test **Buzzer Page**: `/buzzer` (on phone or in dev tools mobile view)
   - Select team
   - Test buzzer button

### 5.2 Real-time Testing

Open admin and buzzer in two windows:

1. In admin: Click "Open Buzzers"
2. In buzzer: Click the "BUZZ" button
3. Buzz should appear in admin immediately

### 5.3 Check for Errors

1. Open DevTools (F12)
2. Check **Console** tab for errors
3. Check **Network** tab for failed requests

## Step 6: Monitor Production

### Set Up Alerts (Optional)

1. In Vercel: **Settings** → **Integrations**
2. Configure Slack/email notifications for:
   - Deployment failures
   - Build errors
   - Performance issues

### Monitor Supabase

1. Supabase Dashboard → **Database** → **Logs**
2. Check for connection errors

## Troubleshooting

### Build Fails with "Environment variables not found"

**Solution:**
1. Go to Vercel project settings
2. Verify both env vars are present
3. Redeploy from the Vercel dashboard

### CORS Errors in Browser

**Solution:**
1. Get your Vercel domain from Vercel dashboard
2. Add it to Supabase CORS settings
3. Wait a few minutes for DNS propagation
4. Refresh the page

### Buzzers Not Working in Real-time

**Solution:**
1. Check browser console for errors
2. Verify Supabase project status
3. Check that Realtime is enabled in Supabase
4. Restart the app

### Teams Not Loading on Buzzer Page

**Solution:**
1. Verify teams are added in admin panel
2. Check that both admin and buzzer use same Supabase project
3. Check browser console for network errors

## Production Checklist

Before going live with real quiz night:

- [ ] Test with multiple browsers (Chrome, Safari, Firefox)
- [ ] Test on multiple devices (phones, tablets)
- [ ] Test on low bandwidth (throttle in DevTools)
- [ ] Verify error pages display correctly
- [ ] Test with 10+ teams simultaneously
- [ ] Test rapid buzzing
- [ ] Verify all quiz questions load correctly
- [ ] Test on actual projector/display
- [ ] Have backup quiz questions
- [ ] Document Vercel and Supabase credentials securely

## Rollback Instructions

If something goes wrong:

1. In Vercel: **Deployments** → find previous working deployment
2. Click **...** → **Promote to Production**
3. Reverting takes ~1-2 minutes

## Performance Optimization

### Vercel Performance

1. Check **Analytics** in Vercel dashboard
2. Monitor Core Web Vitals
3. Identify slow pages

### Database Optimization

1. Monitor Supabase database size
2. Delete old quiz data as needed
3. Use Supabase backups for data retention

## Support

If issues persist:

1. Check GitHub issues
2. Review Supabase documentation
3. Check Vercel deployment logs
4. Test locally with `npm run dev`
