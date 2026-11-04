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

Copy `.env.example` to `.env` and add your project URL and public anon key:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

The app expects `profiles`, `habits`, `habit_logs`, and `focus_sessions` tables.
The profile, habit, and session services document the columns they use. Apply
the SQL migration in `my-app/supabase/migrations` manually before deploying the
updated app. It adds separate profile name columns and a trigger for new
registrations; it retains existing `display_name` values for legacy profiles
and does not rewrite existing user data. A not-valid check constraint preserves
legacy rows while requiring first and last names for new or updated profile
rows. Review the migration before running it.

Configure Supabase Auth to enforce the same registration password rules as the
frontend: at least 8 characters, one uppercase letter, one number, and one
special character. Also configure Row Level Security policies for each
signed-in user before connecting a production project.

Only use the public anon key in this frontend. Never add a Supabase
service-role key to a `VITE_` variable or commit it to the repository.

If either Supabase variable is missing, the app uses local browser storage
instead. That mode is useful for a quick preview, but it does not provide real
authentication or sync data between browsers.

## Handy commands

```sh
npm run dev     # Start the local development server
npm run lint    # Run Oxlint
npm run build   # Type-check and create a production build
npm run preview # Serve the production build locally
```
