# Quick Reference

## Local Development

```bash
# Setup
npm install
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build           # Test production build
npm run type-check      # Check TypeScript
npm run lint            # Check code quality

# Debugging
npm run dev             # Check console for errors
# Open http://localhost:3000/admin and /buzzer in separate tabs
```

## Environment Variables

**Required for development and production:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from: Supabase Dashboard → Project Settings → API

## Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → **New query**
3. Copy entire contents of `supabase/schema.sql` and run it
4. Go to **Project Settings** → **API** and copy the two values above

## Deployment to Vercel

1. Push repo to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click **Add New** → **Project**
4. Import your GitHub repo
5. Add environment variables (same two as above)
6. Click **Deploy**

## Common Tasks

### Add a Team
- Go to `/admin`
- Click **Teams** tab
- Enter team name
- Click **Add**

### Add a Question
- Go to `/admin`
- Click **Questions** tab
- Enter question and optional answer
- Set points (default 10)
- Click **Add Question**

### Run a Quiz
1. Go to `/admin` → **Live** tab
2. Click **Set Live** on a question
3. Click **Open Buzzers** 🟢
4. Teams go to `/buzzer` and click **BUZZ**
5. See buzz order and award points
6. Click **Lock Buzzers** 🔒 when done
7. Click **Reveal Answer** 👁 if available

## Error Messages

| Error | Solution |
|-------|----------|
| Cannot find Supabase variables | Check `.env.local` has both values, or Vercel has them in Settings |
| CORS Error | Add your Vercel domain to Supabase: Settings → API → CORS |
| Buzzer not updating | Check browser console (F12), refresh page, restart dev server |
| Database schema not found | Run entire `supabase/schema.sql` in Supabase SQL Editor |

## Testing Checklist

- [ ] Admin panel loads
- [ ] Can add team
- [ ] Can add question
- [ ] Can start quiz
- [ ] Open/lock buzzers works
- [ ] Buzzer page loads
- [ ] Can select team
- [ ] Can buzz in
- [ ] Real-time updates work (buzzer appears in admin immediately)
- [ ] Error pages display on errors

## File Structure

```
app/
├── admin/page.tsx        ← Admin panel
├── buzzer/page.tsx       ← Team buzzer
└── layout.tsx            ← Root layout

lib/
├── supabase.ts          ← Database setup & types
└── utils.ts             ← Error handling utilities

supabase/
└── schema.sql           ← Database schema
```

## Important Files

- `README.md` - Project overview
- `DEPLOYMENT_GUIDE.md` - How to deploy
- `PRODUCTION_CHECKLIST.md` - Before going live
- `DEVELOPER_GUIDE.md` - For developers
- `.env.local` - Local secrets (never commit!)
- `next.config.ts` - App configuration

## Production URLs

After deploying to Vercel:
- Home: `https://your-domain.vercel.app/`
- Admin: `https://your-domain.vercel.app/admin`
- Buzzer: `https://your-domain.vercel.app/buzzer`

## Getting Help

1. Check browser console (F12 → Console)
2. Check Supabase dashboard for connection issues
3. See **DEPLOYMENT_GUIDE.md** Troubleshooting section
4. Verify `.env.local` or Vercel environment variables
5. Try: `npm run build` locally to catch errors early

## Commands Reference

```bash
# Daily development
npm run dev              # Start dev server

# Before committing
npm run type-check       # Check types
npm run lint             # Check code quality
npm run build            # Test production build

# Deployment (via GitHub)
git add .
git commit -m "message"
git push origin main     # Triggers Vercel auto-deploy
```

## Team Roles

- **Admin** (computer): Uses `/admin` to manage quiz
- **Teams** (phones): Use `/buzzer` to buzz in

## Tips

- Project admin panel on a large screen/projector
- Have each team open buzzer on their own phone
- Test on actual devices before quiz night
- Keep backup questions in case of issues
- Have a network backup plan
- Test with your WiFi router

## Next Steps

1. ✅ Set up Supabase
2. ✅ Deploy to Vercel
3. ✅ Test on multiple devices
4. ✅ Get WiFi working
5. ✅ Do practice run
6. 🎉 Run your quiz!
