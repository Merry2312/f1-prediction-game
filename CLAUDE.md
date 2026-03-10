# F1 Prediction Game — Claude Context

## Project Overview
A web app for a small friend group to predict F1 race outcomes each week and compete on a leaderboard. Users predict pole position, podium (P1/P2/P3), highest scoring constructor, and number of finishers. Predictions lock at race start time. Scoring is binary (right or wrong).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript (Vite) |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Async state | TanStack Query (React Query) |
| Backend / DB | Supabase (free tier) |
| Auth | Supabase Auth (email + password) |
| Hosting | Vercel (free tier, auto-deploy from GitHub) |
| F1 Data | Jolpica API (free, no key required) |

---

## Repository Structure

```
/
├── CLAUDE.md                  ← you are here
├── .env.local                 ← Supabase keys (never commit)
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx                ← Router setup, QueryClient provider
│   ├── lib/
│   │   ├── supabase.ts        ← Supabase client singleton
│   │   └── jolpica.ts         ← F1 API fetch helpers
│   ├── hooks/
│   │   ├── useAuth.ts         ← Auth state (session, user, loading)
│   │   └── useRace.ts         ← Race schedule + results hooks
│   ├── components/
│   │   ├── ProtectedRoute.tsx ← Redirects to /login if not authed
│   │   ├── NavBar.tsx
│   │   ├── DriverSelect.tsx   ← Reusable driver dropdown
│   │   └── ConstructorSelect.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Home.tsx           ← Dashboard: next race countdown, scores
│   │   ├── Schedule.tsx       ← Full season calendar
│   │   ├── Race.tsx           ← Prediction form or locked results view
│   │   ├── Leaderboard.tsx
│   │   ├── Profile.tsx
│   │   └── Admin.tsx          ← Score a completed race (owner only)
│   └── types/
│       └── index.ts           ← Shared TypeScript types
```

---

## Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Both come from the Supabase project dashboard → Settings → API.

---

## Supabase Database Schema

### `profiles`
```sql
id          uuid  PRIMARY KEY REFERENCES auth.users(id)
username    text  UNIQUE NOT NULL
created_at  timestamptz DEFAULT now()
```

### `predictions`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid REFERENCES profiles(id) NOT NULL
race_round          int  NOT NULL
season              int  NOT NULL
pole_driver_id      text NOT NULL   -- Jolpica driverId e.g. "max_verstappen"
p1_driver_id        text NOT NULL
p2_driver_id        text NOT NULL
p3_driver_id        text NOT NULL
top_constructor_id  text NOT NULL   -- Jolpica constructorId e.g. "red_bull"
finishers_count     int  NOT NULL   -- expected: 10–20
submitted_at        timestamptz DEFAULT now()
locked              boolean DEFAULT false

UNIQUE(user_id, race_round, season)
```

### `scores`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid REFERENCES profiles(id) NOT NULL
race_round          int  NOT NULL
season              int  NOT NULL
pole_correct        boolean
p1_correct          boolean
p2_correct          boolean
p3_correct          boolean
constructor_correct boolean
finishers_correct   boolean
total_points        int
calculated_at       timestamptz DEFAULT now()

UNIQUE(user_id, race_round, season)
```

### Row Level Security
- `predictions`: users can SELECT/INSERT/UPDATE their own rows only. No UPDATE if `locked = true`.
- `scores`: all authenticated users can SELECT (needed for leaderboard). Only service role can INSERT/UPDATE.
- `profiles`: users can SELECT all (for leaderboard usernames), UPDATE their own only.

---

## Scoring Rules

All scoring is binary — correct or incorrect, no partial credit.

| Prediction | Points |
|---|---|
| Pole position (exact driver) | 5 |
| P1 winner (exact driver) | 10 |
| P2 (exact driver) | 7 |
| P3 (exact driver) | 5 |
| Highest scoring constructor | 8 |
| Finishers count (exact number) | 5 |
| **Max per race** | **40** |

---

## Jolpica API

Base URL: `https://api.jolpi.ca/ergast/f1`  
No authentication required. Returns JSON.

| Data | Endpoint |
|---|---|
| Season schedule | `GET /2025.json` |
| All drivers (season) | `GET /2025/drivers.json` |
| All constructors (season) | `GET /2025/constructors.json` |
| Race results | `GET /2025/{round}/results.json` |
| Qualifying results | `GET /2025/{round}/qualifying.json` |
| Constructor standings after round | `GET /2025/{round}/constructorStandings.json` |

Driver IDs are strings like `"max_verstappen"`, `"leclerc"`, `"hamilton"`.  
Constructor IDs are strings like `"red_bull"`, `"ferrari"`, `"mercedes"`.

**Prediction locking:** Compare current time against the `races[].date` + `races[].time` fields in the schedule response (UTC). Lock predictions when `Date.now() >= raceStartTime`.

---

## Key Behaviours

- **Prediction form** is only shown when the race has not yet started
- **Once locked**, the race page shows the user's prediction in read-only view alongside actual results (after scoring)
- **Admin scoring** is triggered manually via `/admin/score/:round` — protected by checking `user.id === import.meta.env.VITE_ADMIN_USER_ID`
- **Leaderboard** sums `total_points` from `scores`, joined with `profiles.username`, sorted descending
- **Profile page** shows per-race prediction history with correct/incorrect flags and cumulative points

---

## Development Phases

| Phase | Goal | Status |
|---|---|---|
| 1 | Project foundation: auth, routing, Supabase connection | ⬜ |
| 2 | F1 schedule page from Jolpica API | ⬜ |
| 3 | Driver & constructor data, reusable dropdowns | ⬜ |
| 4 | Prediction form + Supabase storage | ⬜ |
| 5 | Results fetching + score calculation (admin) | ⬜ |
| 6 | Leaderboard + profile page | ⬜ |
| 7 | Polish: UI, countdown timer, mobile | ⬜ |

Work through phases in order. Each phase should be committed and verified before starting the next.

---

## Coding Conventions

- All components in `.tsx`, all utilities in `.ts`
- Use TanStack Query for all async data fetching — no raw `useEffect` + `useState` for API calls
- Supabase calls go through `src/lib/supabase.ts` only — never import the client directly in components
- Jolpica calls go through `src/lib/jolpica.ts` only
- Types for Jolpica API responses live in `src/types/index.ts`
- Tailwind only for styling — no inline styles, no CSS modules
- Use `react-router-dom` `<Link>` for navigation, never `<a href>`

---

## Notes

- This is a free-tier project. Do not introduce any paid services or APIs.
- The Jolpica API has no SLA — add sensible error states for when it's slow or down.
- Keep the admin scoring flow simple — it runs once per race weekend, manual trigger is fine.
- The current season year (2025) should be a constant, not hardcoded throughout the codebase. Define it once in `src/lib/jolpica.ts`.