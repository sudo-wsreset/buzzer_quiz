# Production Checklist

Before deploying to production, ensure all items below are completed:

## Environment & Configuration

- [ ] Supabase project created and configured
- [ ] Database schema deployed (`supabase/schema.sql` executed)
- [ ] Realtime enabled for all tables (buzzes, quiz_state, teams, questions)
- [ ] Row Level Security policies verified
- [ ] Environment variables set in Vercel (.env.local, .env.production)
- [ ] NEXT_PUBLIC_SUPABASE_URL points to production Supabase instance
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY is set (public key only, never expose service-role)

## Code Quality

- [ ] All TypeScript errors resolved (`npm run type-check`)
- [ ] ESLint warnings cleared (`npm run lint`)
- [ ] No console.error() in production code (except error handlers)
- [ ] Error boundaries tested locally
- [ ] Loading states working correctly
- [ ] Toast notifications displaying properly

## Security

- [ ] No secrets in code or .env files
- [ ] .env.local is in .gitignore ✓ (already configured)
- [ ] CORS properly configured in Supabase for Vercel domain
- [ ] Security headers enabled in next.config.ts ✓ (already configured)
- [ ] X-Frame-Options set to SAMEORIGIN
- [ ] X-Content-Type-Options set to nosniff
- [ ] Referrer-Policy configured

## Performance

- [ ] Build completes without errors (`npm run build`)
- [ ] Production build size reasonable (check Vercel analytics)
- [ ] No unused dependencies
- [ ] Images optimized
- [ ] API calls debounced where needed

## Testing

- [ ] Admin panel fully functional:
  - [ ] Add teams
  - [ ] Add questions
  - [ ] Navigate questions
  - [ ] Open/lock buzzers
  - [ ] Award points
  - [ ] Reveal answers
- [ ] Buzzer page fully functional:
  - [ ] Select team
  - [ ] Buzz button works
  - [ ] Buzz order displays
  - [ ] Position updates in real-time
- [ ] Real-time sync tested across multiple devices
- [ ] Network error handling tested
- [ ] Mobile responsiveness verified

## Documentation

- [ ] README.md updated with deployment instructions
- [ ] Environment variables documented in .env.local.example
- [ ] Troubleshooting section added to README

## Deployment

- [ ] Repository pushed to GitHub
- [ ] Vercel project created and linked
- [ ] Environment variables added to Vercel
- [ ] Build settings verified in Vercel
- [ ] Domain configured (if custom domain)
- [ ] GitHub Actions CI/CD configured

## Post-Deployment

- [ ] Production URLs tested (admin + buzzer)
- [ ] Real-time sync verified on production
- [ ] Error pages display correctly (404, 500)
- [ ] Browser console clear of errors
- [ ] Vercel analytics monitored for issues

## Monitoring

- [ ] Vercel logging configured
- [ ] Supabase monitoring enabled
- [ ] Alert notifications set up for errors
- [ ] Performance metrics tracked

---

## Quick Deployment Commands

```bash
# Local verification
npm run type-check
npm run lint
npm run build

# Deploy to Vercel
# (automatic via GitHub push or manual via Vercel CLI)
vercel --prod
```
