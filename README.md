# F1 Prediction Game

A web app for a small friend group to predict F1 race outcomes each week and compete on a leaderboard. Predict pole position, podium finishers, top constructor, and number of finishers. Predictions lock at race start. Scoring is binary — right or wrong, no partial credit.

## Stack

- **Frontend:** React 19 + TypeScript (Vite)
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v7
- **Async state:** TanStack Query v5
- **Backend / DB:** Supabase (auth + Postgres)
- **F1 Data:** [Jolpica API](https://api.jolpi.ca/ergast/f1) (free, no key required)
- **Hosting:** Vercel

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from **Settings → API**
3. Create `.env.local` in the project root:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

4. Run the following SQL in the Supabase SQL editor to create the required tables:

```sql
-- Profiles (one per auth user)
create table profiles (
  id uuid primary key references auth.users(id),
  username text unique not null,
  created_at timestamptz default now()
);

-- Predictions (one per user per race)
create table predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  race_round int not null,
  season int not null,
  pole_driver_id text not null,
  p1_driver_id text not null,
  p2_driver_id text not null,
  p3_driver_id text not null,
  top_constructor_id text not null,
  finishers_count int not null,
  submitted_at timestamptz default now(),
  locked boolean default false,
  unique(user_id, race_round, season)
);

-- Scores (calculated after each race)
create table scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  race_round int not null,
  season int not null,
  pole_correct boolean,
  p1_correct boolean,
  p2_correct boolean,
  p3_correct boolean,
  constructor_correct boolean,
  finishers_correct boolean,
  total_points int,
  calculated_at timestamptz default now(),
  unique(user_id, race_round, season)
);

-- Row Level Security
alter table profiles enable row level security;
alter table predictions enable row level security;
alter table scores enable row level security;

create policy "Users can view all profiles" on profiles for select to authenticated using (true);
create policy "Users can update own profile" on profiles for update to authenticated using (auth.uid() = id);

create policy "Users can view own predictions" on predictions for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own predictions" on predictions for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own unlocked predictions" on predictions for update to authenticated using (auth.uid() = user_id and locked = false);

create policy "Anyone authenticated can view scores" on scores for select to authenticated using (true);
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Scoring

| Prediction | Points |
|---|---|
| Pole position (exact driver) | 5 |
| P1 winner (exact driver) | 10 |
| P2 (exact driver) | 7 |
| P3 (exact driver) | 5 |
| Highest scoring constructor | 8 |
| Finishers count (exact number) | 5 |
| **Max per race** | **40** |

## Other Commands

```bash
npm run build    # Production build
npm run preview  # Preview production build locally
npm run lint     # Lint
```