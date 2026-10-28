# Focus Log

A React, TypeScript, and Vite application for tracking focus sessions and habits.
Tailwind CSS v4 is integrated through the Vite plugin.

## Setup

```sh
npm install
```

Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` to your Supabase project values. These are public client
credentials; never put a service-role key in the client environment.

The app falls back to local browser storage when the Supabase variables are not
configured.

## Commands

```sh
npm run dev
npm run lint
npm run build
npm run preview
```
