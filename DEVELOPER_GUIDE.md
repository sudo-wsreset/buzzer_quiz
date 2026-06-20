# Developer Guide

## Project Structure

```
buzzer-quiz/
├── app/                        # Next.js app directory
│   ├── admin/                  # Admin panel page
│   │   ├── page.tsx           # Admin main component
│   │   └── error.tsx          # Admin error boundary
│   ├── buzzer/                # Team buzzer page
│   │   ├── page.tsx           # Buzzer main component
│   │   └── error.tsx          # Buzzer error boundary
│   ├── globals.css            # Global Tailwind styles
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page with links
│   ├── error.tsx              # Global error boundary
│   └── not-found.tsx          # 404 page
├── lib/                        # Shared utilities
│   ├── supabase.ts            # Supabase client setup & types
│   └── utils.ts               # Error handling, logging utilities
├── public/                     # Static assets
├── supabase/                   # Database setup
│   └── schema.sql             # Database schema
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions CI/CD
├── scripts/
│   └── verify-env.sh          # Environment verification script
├── .env.local                 # Local environment variables (git-ignored)
├── DEPLOYMENT_GUIDE.md        # Deployment instructions
├── PRODUCTION_CHECKLIST.md    # Pre-deployment checklist
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript configuration
├── next.config.ts             # Next.js configuration
├── middleware.ts              # Request middleware & security
├── vercel.json                # Vercel configuration
└── eslint.config.mjs          # ESLint configuration
```

## Development Setup

### 1. Clone and Install

```bash
git clone <repository>
cd buzzer-quiz
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials.

### 3. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Development Workflow

### Making Changes

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run checks: `npm run type-check && npm run lint`
4. Commit: `git commit -m "feat: describe change"`
5. Push: `git push origin feature/my-feature`
6. Create a Pull Request on GitHub

### Code Quality

- **Type Checking**: `npm run type-check`
- **Linting**: `npm run lint`
- **Building**: `npm run build`
- **Development**: `npm run dev`

### File Modifications Guide

#### Adding a New Page

1. Create a directory under `app/`
2. Add `page.tsx` and optional `error.tsx`
3. Use Next.js 16+ app router conventions

#### Updating Database Schema

1. Modify `supabase/schema.sql`
2. Run changes in Supabase SQL Editor
3. Update types in `lib/supabase.ts` if needed
4. Test locally before committing

#### Adding Error Handling

Use the utilities from `lib/utils.ts`:

```typescript
import { logger, getUserFriendlyErrorMessage } from "@/lib/utils";

try {
  // your code
} catch (err) {
  logger.error("Operation Name", err);
  const userMessage = getUserFriendlyErrorMessage(err);
  // show userMessage to user
}
```

#### Real-time Subscriptions

Subscribe to Supabase changes in `useEffect`:

```typescript
useEffect(() => {
  const channel = supabase
    .channel("my-channel")
    .on("postgres_changes", { event: "*", schema: "public", table: "my_table" }, () => {
      // handle changes
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## Debugging

### Browser DevTools

- **Console**: Check for errors and logs
- **Network**: Verify API requests
- **Application**: Check localStorage (team selection)
- **Performance**: Profile app performance

### Local Logging

Development console output is enabled in `lib/utils.ts`:

```typescript
logger.info("Label", "message"); // dev only
logger.error("Label", error);    // always logged
```

### Supabase Real-time Testing

1. Open Supabase dashboard
2. **Realtime** section shows active subscriptions
3. Check for connection issues

## Testing Locally

### Test Multiple Tabs

1. Admin in one tab: `http://localhost:3000/admin`
2. Buzzer in another tab: `http://localhost:3000/buzzer`
3. Phone/tablet: use your computer's IP (e.g., `192.168.1.100:3000`)

### Test Error Scenarios

1. Disconnect internet → see error boundary
2. Wrong Supabase credentials → see init error
3. Rapid clicking → app should handle gracefully

### Test Real-time

1. Add team in admin
2. Buzzer page should update without refresh
3. Open buzzer → team should appear immediately

## Common Tasks

### Add a New Toast Notification

In admin page:
```typescript
showToast("Success message");
showToast("Error message", "error");
```

### Add TypeScript Type

Define in `lib/supabase.ts`:
```typescript
export type MyType = {
  id: string;
  name: string;
};
```

### Add Environment Variable

1. Add to `.env.local.example`
2. Add to `.env.local` (local development)
3. Add to Vercel (production)
4. Use in code: `process.env.NEXT_PUBLIC_VAR_NAME`

## Performance Tips

### Optimize Renders

- Use `useCallback` for event handlers
- Use `useMemo` for expensive computations
- Avoid passing objects as dependencies to `useEffect`

### Optimize API Calls

- Use `debounce` from `lib/utils.ts` for rapid operations
- Batch requests with `Promise.all` when possible
- Implement error retry logic with `retryAsync`

### Monitor Production

- Check Vercel Analytics
- Monitor Supabase query performance
- Set up error tracking (Sentry, LogRocket, etc.)

## Troubleshooting Development

### Types Not Working

```bash
npm run type-check
```

### Lint Errors

```bash
npm run lint
```

### Build Fails Locally

```bash
rm -rf .next
npm run build
```

### Hot Reload Not Working

1. Make sure you're running `npm run dev`
2. Check that files are saved (not in editor undo)
3. Restart dev server

## Git Workflow

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: resolve bug
docs: update documentation
refactor: reorganize code
style: formatting changes
test: add tests
```

### Before Pushing

```bash
npm run type-check  # TypeScript errors
npm run lint        # Code quality
npm run build       # Build succeeds
git status          # No unwanted files
```

## Team Collaboration

### Code Review Checklist

- [ ] TypeScript types are correct
- [ ] Error handling is present
- [ ] No console.log() in production code
- [ ] Comments explain complex logic
- [ ] Tests added for new features
- [ ] Documentation updated

### Asking for Help

1. Check existing issues/PRs
2. Provide minimal reproducible example
3. Include error messages and logs
4. Describe expected vs actual behavior

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
