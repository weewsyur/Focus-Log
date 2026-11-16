# Focus Log

Focus Log is a small study companion for keeping track of focused work. Start a
timer, choose what you’re studying, check off daily habits, and review your
sessions and streaks from the dashboard.

## What’s inside

- Focus and break timers, with adjustable durations
- Daily habits, completion tracking, and streaks
- Session history, weekly and monthly analytics
- Profile settings for your name and timer defaults
- Supabase-backed accounts and data, with a browser-storage fallback for trying
  the app without a Supabase project

## Run it locally

You’ll need Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Vite prints a local URL when the development server is ready. To check a
production build, run:

```sh
npm run build
npm run preview
```

## Supabase setup

Add your project URL and public key to `my-app/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
```

The app also accepts `VITE_SUPABASE_ANON_KEY` for older setups. In Vercel, add
`VITE_SUPABASE_URL` and either public-key variable under **Project Settings →
Environment Variables**, enable them for the environments you deploy, then
redeploy. Do not use a Supabase service-role key in the frontend.

The app expects `profiles`, `habits`, `habit_logs`, and `focus_sessions` tables.
The profile, habit, and session services document the columns they use. Apply
the SQL migrations in `my-app/supabase/migrations` in timestamp order before
deploying. The app-table repair migration creates missing tables, backfills
missing profiles from Auth metadata without overwriting existing profile data,
and applies per-user access policies. The profile-name migration adds separate
name columns and a registration trigger; its check accepts structured
first/last names or a legacy display name. Review the migrations before
running them.

Configure Supabase Auth to enforce the same registration password rules as the
frontend: at least 8 characters, one uppercase letter, one number, and one
special character. Also configure Row Level Security policies for each
signed-in user before connecting a production project.

Only use the public anon key in this frontend. Never add a Supabase
service-role key to a `VITE_` variable or commit it to the repository.

If the Supabase URL or both public-key variables are missing, the app uses
local browser storage instead. That mode is useful for a quick preview, but it
does not provide real authentication or sync data between browsers.

## Handy commands

```sh
npm run dev     # Start the local development server
npm run lint    # Run Oxlint
npm run build   # Type-check and create a production build
npm run preview # Serve the production build locally
```
