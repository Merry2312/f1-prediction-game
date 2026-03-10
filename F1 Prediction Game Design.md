# 🏎️ F1 Prediction Game — Design Document

**Project type:** Web app for a small friend group  
**Stack:** React + TypeScript + Supabase + Jolpica F1 API  
**Cost:** $0 (all free tiers)

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend framework | React 18 + TypeScript | Via Vite for fast dev experience |
| Styling | Tailwind CSS | Utility-first, no build complexity |
| Hosting | Vercel (free) | Auto-deploys from GitHub |
| Database + Auth | Supabase (free tier) | Postgres + built-in auth + Row Level Security |
| F1 Data | Jolpica API | Free, no API key, REST — replaces Ergast |
| State management | React Query (TanStack) | Caching + async state for API calls |
| Routing | React Router v6 | Client-side routing |

### Jolpica API base URL
```
https://api.jolpi.ca/ergast/f1/
```
All endpoints return JSON. No key needed. Example:
- Season schedule: `GET /2026.json`
- Race results: `GET /2026/5/results.json`
- Qualifying results: `GET /2026/5/qualifying.json`
- Driver list: `GET /2026/drivers.json`
- Constructor list: `GET /2026/constructors.json`

---

## Scoring System

All predictions are **binary** — correct or incorrect, no partial credit.

| Prediction | Points if correct |
|---|---|
| Pole position (exact driver) | 5 pts |
| P1 winner (exact driver) | 10 pts |
| P2 (exact driver) | 7 pts |
| P3 (exact driver) | 5 pts |
| Highest scoring constructor | 8 pts |
| Number of cars that finish (exact) | 5 pts |
| **Max per race** | **40 pts** |

> Predictions lock automatically at the published race start time. No editing after that point.

---

## Supabase Database Schema

### `profiles` table
```sql
id          uuid  (references auth.users, primary key)
username    text  (unique, display name)
created_at  timestamptz
```

### `predictions` table
```sql
id                  uuid (primary key, default gen_random_uuid())
user_id             uuid (references profiles.id)
race_round          int  (Jolpica round number, e.g. 5)
season              int  (e.g. 2026)
pole_driver_id      text (Jolpica driverId, e.g. "max_verstappen")
p1_driver_id        text
p2_driver_id        text
p3_driver_id        text
top_constructor_id  text (Jolpica constructorId, e.g. "red_bull")
finishers_count     int
submitted_at        timestamptz
locked              boolean default false
```
Unique constraint on `(user_id, race_round, season)`.

### `scores` table
```sql
id                  uuid (primary key)
user_id             uuid (references profiles.id)
race_round          int
season              int
pole_correct        boolean
p1_correct          boolean
p2_correct          boolean
p3_correct          boolean
constructor_correct boolean
finishers_correct   boolean
total_points        int
calculated_at       timestamptz
```

### Row Level Security (RLS) Policies
- Users can only read/write **their own** predictions
- Scores are **readable by all** authenticated users (for leaderboard)
- Predictions are **not updatable** if `locked = true`
- Admin role (you) can insert into scores after each race

---

## App Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Home / Dashboard | Next race countdown, recent scores, quick links |
| `/login` | Login | Email + password via Supabase Auth |
| `/register` | Register | Create account, choose username |
| `/schedule` | Race Schedule | Full season calendar, race status badges |
| `/race/:round` | Race Detail | Prediction form OR locked view + results |
| `/leaderboard` | Leaderboard | All-time and per-race points table |
| `/profile` | My Profile | My prediction history, accuracy stats |

---

## Development Phases

Work through these one at a time. Each phase has a clear "done" state you can verify before moving on.

---

### Phase 1 — Project Foundation
**Goal:** A working React app that can talk to Supabase.

Tasks:
1. Scaffold with Vite: `npm create vite@latest f1-predictions -- --template react-ts`
2. Install deps: Tailwind, React Router, TanStack Query, Supabase JS client
3. Create Supabase project (supabase.com → new project, free tier)
4. Add `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
5. Create `src/lib/supabase.ts` client singleton
6. Build Login and Register pages using Supabase Auth
7. Add a protected route wrapper (redirect to `/login` if not authenticated)
8. Add a top navigation bar with logout button

**Verify:** You can sign up, log in, see a placeholder home page, and log out. Auth state persists on refresh.

---

### Phase 2 — F1 Schedule
**Goal:** Display the current season's race calendar fetched live.

Tasks:
1. Create `src/api/jolpica.ts` with fetch helpers
2. Fetch season schedule: `GET https://api.jolpi.ca/ergast/f1/2026.json`
3. Build `/schedule` page with race cards: name, circuit, country, date
4. Show race status badge: Upcoming / This Week / Completed
5. Clicking a race navigates to `/race/:round`

**Verify:** Schedule page loads with all 2026 races. Dates are correct. Status badges reflect today's date accurately.

---

### Phase 3 — Driver & Constructor Data
**Goal:** Populate dropdowns for the prediction form.

Tasks:
1. Fetch current season drivers: `GET /2026/drivers.json`
2. Fetch current season constructors: `GET /2026/constructors.json`
3. Cache both in React Query with a long stale time (they rarely change)
4. Build reusable `<DriverSelect>` and `<ConstructorSelect>` components

**Verify:** Both dropdowns render with all current F1 drivers and constructors. Selecting an option stores the Jolpica ID string.

---

### Phase 4 — Prediction Form
**Goal:** Users can submit predictions for an upcoming race.

Tasks:
1. Create Supabase `predictions` table (use SQL editor in Supabase dashboard)
2. Apply RLS policies so users can only read/write their own rows
3. Build the prediction form on `/race/:round` with 6 fields:
   - Pole driver (DriverSelect)
   - P1 driver (DriverSelect)
   - P2 driver (DriverSelect)
   - P3 driver (DriverSelect)
   - Top constructor (ConstructorSelect)
   - Finishers count (number input, range 10–20)
4. On submit: upsert into `predictions` table
5. Show existing prediction if one already exists (pre-fill form)
6. Lock form if race start time has passed (compare to Jolpica schedule datetime)

**Verify:** Submit a prediction. Refresh the page — it should pre-fill with your saved prediction. Wait (or manually set) past race time — form should show as locked/read-only.

---

### Phase 5 — Results & Scoring
**Goal:** After a race, pull results and calculate scores automatically.

Tasks:
1. Create Supabase `scores` table
2. Build an admin-only page `/admin/score/:round` (protect with a check on your user ID)
3. On this page, fetch race results from Jolpica:
   - Results: `GET /2026/:round/results.json`
   - Qualifying: `GET /2026/:round/qualifying.json`
   - Constructor standings: `GET /2026/:round/constructorStandings.json`
4. For each user's prediction for this round:
   - Compare each field against the real result
   - Calculate total_points
   - Upsert into `scores` table
5. Show a confirmation of scores written

**Verify:** After running scoring for a completed race, the `scores` table is populated with correct boolean flags and point totals for each user.

---

### Phase 6 — Leaderboard & Profile
**Goal:** Users can see how they're doing vs the group.

Tasks:
1. Build `/leaderboard` page:
   - Query `scores` table, group by `user_id`, sum `total_points`
   - Join with `profiles` to show usernames
   - Show rank, username, total points, races predicted
2. Build `/profile` page:
   - Show the current user's prediction history
   - For each race: what they predicted vs actual result, points earned
   - Overall accuracy percentage per category

**Verify:** Leaderboard ranks all users by total points. Profile shows full prediction history with correct/incorrect indicators.

---

### Phase 7 — Polish
**Goal:** Make it feel like a real product your friends will enjoy.

Ideas:
- F1-themed colour scheme (red, black, white — or your own spin)
- Race countdown timer on the home page
- Confetti animation when you submit a prediction
- Mobile-responsive layout (Tailwind makes this easy)
- Share your score card as an image
- Email notifications via Supabase Edge Functions (optional, still free tier)

---

## Environment Setup Checklist

```
□ Node.js 18+ installed
□ GitHub account (for Vercel auto-deploy)
□ Supabase account created (supabase.com)
□ Vercel account connected to GitHub (vercel.com)
□ .env.local file with Supabase keys (never commit this)
```

## Key Files to Create Early

```
src/
  lib/
    supabase.ts        ← Supabase client
    jolpica.ts         ← F1 API fetch helpers
  hooks/
    useAuth.ts         ← Auth state hook
    useRace.ts         ← Race data hook
  components/
    ProtectedRoute.tsx ← Auth guard
    DriverSelect.tsx   ← Reusable dropdown
    ConstructorSelect.tsx
  pages/
    Login.tsx
    Register.tsx
    Schedule.tsx
    Race.tsx
    Leaderboard.tsx
    Profile.tsx
```

---

## Free Tier Limits (Nothing to worry about for a friend group)

| Service | Free Limit | Expected Usage |
|---|---|---|
| Supabase DB | 500 MB storage | < 1 MB for a season |
| Supabase Auth | 50,000 MAU | You have a few friends |
| Vercel | 100 GB bandwidth/month | Tiny |
| Jolpica API | Unlimited (open) | Low frequency |

---

*Start with Phase 1. Don't move to Phase 2 until you can log in and out successfully. Good luck — and may your pole predictions be correct.*