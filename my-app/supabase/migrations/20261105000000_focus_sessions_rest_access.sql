BEGIN;

CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  subject text NOT NULL,
  duration_min integer NOT NULL CHECK (duration_min > 0),
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS focus_sessions_user_completed_at_idx
  ON public.focus_sessions (user_id, completed_at DESC);

GRANT USAGE ON SCHEMA public TO authenticated;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.focus_sessions FROM anon, PUBLIC;
GRANT SELECT, INSERT ON TABLE public.focus_sessions TO authenticated;

DROP POLICY IF EXISTS focus_sessions_select_own ON public.focus_sessions;
CREATE POLICY focus_sessions_select_own ON public.focus_sessions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS focus_sessions_insert_own ON public.focus_sessions;
CREATE POLICY focus_sessions_insert_own ON public.focus_sessions
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS focus_sessions_restrict_to_own ON public.focus_sessions;
CREATE POLICY focus_sessions_restrict_to_own ON public.focus_sessions
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

NOTIFY pgrst, 'reload schema';
COMMIT;
