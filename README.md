# 🔔 Buzzer Quiz System

A real-time buzzer system for offline quiz nights. Host on Vercel — the
admin panel runs the show on a projector, teams buzz in from their phones.

- **Admin Panel** (`/admin`) — projected on a screen. Add teams & questions,
  step through the quiz, open/lock buzzers, see live ranked buzz order,
  award points, track the scoreboard.
- **Team Buzzer** (`/buzzer`) — opened on each team's phone. Pick your team
  name once, then tap the big buzzer button when it's live.

Realtime sync (buzzes appearing instantly on the admin screen) is powered by
**Supabase Realtime** (free tier is plenty for this).

---

## 🚀 Quick Start (Development)

### 1. Set up Supabase (free)

1. Go to [supabase.com](https://supabase.com) → New Project (free tier).
2. Once created, open **SQL Editor** → **New query**.
3. Paste the entire contents of [supabase/schema.sql](./supabase/schema.sql)
   and click **Run**. This creates all tables, enables Realtime, and sets up
   permissive Row Level Security policies (fine for a trusted-room party app
   with no login).
4. Go to **Project Settings → API**. Copy:
   - **Project URL**
   - **anon public** key

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase values:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll see links to the Admin Panel and Team Buzzer.

---

## 📦 Production Deployment (Vercel)

### Prerequisites
- Supabase project set up with schema (steps 1-2 above)
- GitHub account with this repo pushed

### Step-by-Step Deployment

#### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/buzzer-quiz.git
git push -u origin main
```

#### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New** → **Project**
3. Select this repository
4. Configure environment variables:
   - **Project Settings** → **Environment Variables**
   - Add both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Make sure they're set for **Production**, **Preview**, and **Development**
5. Click **Deploy**

#### 3. Update Supabase CORS (if needed)

If you get CORS errors on production:

1. Go to Supabase Dashboard → **Project Settings** → **API**
2. Under **Security & CORS**, add your Vercel domain (e.g., `buzzer-quiz.vercel.app`)

#### 4. Get your production URL

After deployment, Vercel will show your URL:
- Admin Panel: `https://your-domain.vercel.app/admin`
- Team Buzzer: `https://your-domain.vercel.app/buzzer`

---

## 🎮 Usage

### Admin Panel

1. Open `/admin` on a screen/projector
2. **Teams tab**: Add teams (give each a name, e.g., "Team A", "Nerds", etc.)
3. **Questions tab**: Add all your questions before the quiz starts
4. **Live tab**: 
   - Click "Set Live" on a question to display it
   - Click "Open Buzzers" to let teams buzz in
   - Teams appear in "Buzz Order" as they buzz
   - Click the points button to award points
   - Click "Lock Buzzers" to stop accepting buzzes
   - Click "Reveal Answer" to show the answer
   - Use "Reset Round" for the next question

### Team Buzzer

1. Open `/buzzer` on each team's phone
2. Select your team name
3. Wait for the admin to open buzzers
4. Tap the big red button to buzz in
5. See your position in the queue

---

## 🔐 Security Notes

- This app uses **permissive Row Level Security** (all public read/write) because it's designed for a trusted, closed room (quiz night with friends)
- **Never expose your Supabase service-role key** — only use the `anon` (public) key
- For production, consider adding authentication if hosting on the public internet
- Environment variables starting with `NEXT_PUBLIC_` are visible in the browser — this is intentional and safe for public keys

---

## 🛠️ Troubleshooting

### "Cannot find Supabase environment variables"
- Check that `.env.local` exists with your Supabase URL and key
- Verify keys are correct (copy-paste from Supabase dashboard)
- In Vercel, go to **Settings** → **Environment Variables** and add them there too

### Buzzers not updating in real-time
- Check browser console for errors (F12 → Console tab)
- Verify your Supabase project has Realtime enabled
- Restart the dev server: `npm run dev`

### Teams not showing on buzzer page
- Make sure teams are added in the admin panel first
- Refresh the buzzer page
- Check admin/buzzer are on same Supabase project

### Deployment stuck at "Building..."
- Check Vercel's build logs (click on the deployment)
- Make sure both env vars are set in Vercel project settings
- Try redeploying from the dashboard

---

## 📝 Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL + Realtime)
- **Hosting**: Vercel
- **Real-time**: Supabase Postgres Changes + Realtime Subscriptions

---

## 🎯 Next Steps (Optional Enhancements)

- Add authentication (Google OAuth) if hosting publicly
- Store quiz templates/results
- Add sound effects for buzzes
- Mobile app version
- Customizable team colors
- Export quiz results to CSV

---

## 📄 License

MIT — feel free to fork and modify!

---

**Questions?** Open an issue or check the troubleshooting section above.
using your computer's local IP) to test buzzing.

## 4. Deploy to Vercel

```bash
npx vercel
```

Or push this repo to GitHub and import it in the Vercel dashboard
(vercel.com/new). When prompted, add the two environment variables from
step 2 in the Vercel project settings (Settings → Environment Variables),
then deploy.

You'll get a URL like `https://your-quiz.vercel.app`. Use:
- `https://your-quiz.vercel.app/admin` on the projector/host laptop
- `https://your-quiz.vercel.app/buzzer` shared with teams (e.g. via QR code)
  to open on their phones

> Tip: generate a QR code for the `/buzzer` URL (any free QR generator) and
> display it on the projector before the quiz starts so teams can scan and
> join instantly.

---

## How it works

### Quiz flow
1. **Before the quiz**: In the Admin Panel, add your teams (Teams tab) and
   pre-load your questions (Questions tab).
2. **Teams join**: Each team opens the `/buzzer` link on one phone and taps
   their team name.
3. **Per question**: Admin clicks a question to set it "Live" (or uses
   Next/Prev), which displays it on the projector and resets buzzers.
4. **Open Buzzers**: Admin clicks "Open Buzzers" — phones light up red and
   teams can now tap. Buzzes appear instantly on the admin screen in the
   order they were pressed (1st, 2nd, 3rd...).
5. Admin can Lock Buzzers any time, Reveal Answer, award points to the
   team(s) that answered correctly (the small + button next to their name
   in Buzz Order, or use the scoreboard +/- controls), then Reset Round or
   move to the Next question.

### Data model (Supabase)
- `teams` — team names + running score
- `questions` — preloaded question bank with optional answer text + points
- `quiz_state` — single row holding which question is live, whether
  buzzers are open, and a `round_token` (a fresh UUID each round) so old
  buzzes never leak into a new round
- `buzzes` — every buzz press, timestamped, scoped to a `round_token`

### Real-time
All pages subscribe to Postgres changes via Supabase Realtime, so:
- Admin sees every buzz the instant it lands (sub-second over WiFi).
- Buzzer phones instantly reflect when buzzers open/lock or a new question
  goes live.

---

## Customizing

- **Point values**: editable per-question when you add them.
- **Manual score adjustments**: use the +/- buttons on the Scoreboard at
  any time (e.g. to deduct points, handle ties, manual overrides).
- **Styling**: everything is Tailwind CSS in `app/admin/page.tsx` and
  `app/buzzer/page.tsx` — colors, sizing, and layout are easy to tweak.
- **Security**: this app uses Supabase's `anon` key with open RLS policies
  — fine for a private party/event link. If you want to lock it down (e.g.
  prevent randoms from hitting your `/admin` URL), consider adding a simple
  password gate or Vercel password protection (available on Pro plans) in
  front of `/admin`.

## Tech stack
- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + Realtime)
- Deployed on Vercel
