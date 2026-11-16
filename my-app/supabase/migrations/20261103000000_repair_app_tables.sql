-- Create or repair app tables before the profile-name migration.
BEGIN;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text,
  default_focus_min integer NOT NULL DEFAULT 25,
  default_break_min integer NOT NULL DEFAULT 5
);

CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  subject text NOT NULL,
  duration_min integer NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS habits_id_user_id_key ON public.habits (id, user_id);

CREATE TABLE IF NOT EXISTS public.habit_logs (
  habit_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  log_date date NOT NULL,
  PRIMARY KEY (habit_id, log_date),
  FOREIGN KEY (habit_id, user_id)
    REFERENCES public.habits (id, user_id) ON DELETE CASCADE
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS middle_name text,
  ADD COLUMN IF NOT EXISTS suffix text,
  ADD COLUMN IF NOT EXISTS default_focus_min integer NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS default_break_min integer NOT NULL DEFAULT 5;

UPDATE public.profiles SET default_focus_min = 25 WHERE default_focus_min IS NULL;
UPDATE public.profiles SET default_break_min = 5 WHERE default_break_min IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN default_focus_min SET DEFAULT 25,
  ALTER COLUMN default_focus_min SET NOT NULL,
  ALTER COLUMN default_break_min SET DEFAULT 5,
  ALTER COLUMN default_break_min SET NOT NULL;

DO $constraints$
DECLARE
  profile_id smallint;
  auth_user_id smallint;
BEGIN
  SELECT attnum INTO profile_id
  FROM pg_attribute
  WHERE attrelid = 'public.profiles'::regclass AND attname = 'id' AND NOT attisdropped;

  SELECT attnum INTO auth_user_id
  FROM pg_attribute
  WHERE attrelid = 'auth.users'::regclass AND attname = 'id' AND NOT attisdropped;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'p'
      AND conkey = ARRAY[profile_id]
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'f'
      AND confrelid = 'auth.users'::regclass
      AND conkey = ARRAY[profile_id]
      AND confkey = ARRAY[auth_user_id]
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE NOT VALID;
  END IF;
END;
$constraints$;

INSERT INTO public.profiles (
  id, display_name, first_name, last_name, middle_name, suffix,
  default_focus_min, default_break_min
)
SELECT
  u.id,
  COALESCE(NULLIF(BTRIM(u.raw_user_meta_data ->> 'display_name'), ''), SPLIT_PART(COALESCE(u.email, ''), '@', 1)),
  NULLIF(BTRIM(u.raw_user_meta_data ->> 'first_name'), ''),
  NULLIF(BTRIM(u.raw_user_meta_data ->> 'last_name'), ''),
  NULLIF(BTRIM(u.raw_user_meta_data ->> 'middle_name'), ''),
  NULLIF(BTRIM(u.raw_user_meta_data ->> 'suffix'), ''),
  25,
  5
FROM auth.users AS u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles AS p WHERE p.id = u.id);

CREATE OR REPLACE FUNCTION public.focus_log_handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_first_name text := nullif(btrim(NEW.raw_user_meta_data ->> 'first_name'), '');
  v_last_name text := nullif(btrim(NEW.raw_user_meta_data ->> 'last_name'), '');
  v_middle_name text := nullif(btrim(NEW.raw_user_meta_data ->> 'middle_name'), '');
  v_suffix text := nullif(btrim(NEW.raw_user_meta_data ->> 'suffix'), '');
  v_display_name text := nullif(btrim(NEW.raw_user_meta_data ->> 'display_name'), '');
BEGIN
  IF v_first_name IS NULL OR v_last_name IS NULL THEN
    RAISE EXCEPTION 'First name and last name are required for new profiles';
  END IF;

  INSERT INTO public.profiles (
    id, display_name, first_name, last_name, middle_name, suffix,
    default_focus_min, default_break_min
  )
  VALUES (
    NEW.id,
    coalesce(v_display_name, concat_ws(' ', v_first_name, v_middle_name, v_last_name, v_suffix)),
    v_first_name,
    v_last_name,
    v_middle_name,
    v_suffix,
    25,
    5
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    middle_name = EXCLUDED.middle_name,
    suffix = EXCLUDED.suffix;

  RETURN NEW;
END;
$function$;

DO $trigger$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'focus_log_on_auth_user_created_profile'
      AND tgrelid = 'auth.users'::regclass
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER focus_log_on_auth_user_created_profile
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.focus_log_handle_new_user_profile();
  END IF;
END;
$trigger$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profiles FROM anon, PUBLIC;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS profiles_restrict_to_own ON public.profiles;
CREATE POLICY profiles_restrict_to_own ON public.profiles
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.focus_sessions FROM anon, PUBLIC;
GRANT SELECT, INSERT ON TABLE public.focus_sessions TO authenticated;

DROP POLICY IF EXISTS focus_sessions_select_own ON public.focus_sessions;
CREATE POLICY focus_sessions_select_own ON public.focus_sessions
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS focus_sessions_insert_own ON public.focus_sessions;
CREATE POLICY focus_sessions_insert_own ON public.focus_sessions
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS focus_sessions_restrict_to_own ON public.focus_sessions;
CREATE POLICY focus_sessions_restrict_to_own ON public.focus_sessions
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.habits FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.habits TO authenticated;

DROP POLICY IF EXISTS habits_select_own ON public.habits;
CREATE POLICY habits_select_own ON public.habits
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS habits_insert_own ON public.habits;
CREATE POLICY habits_insert_own ON public.habits
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS habits_update_own ON public.habits;
CREATE POLICY habits_update_own ON public.habits
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS habits_delete_own ON public.habits;
CREATE POLICY habits_delete_own ON public.habits
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS habits_restrict_to_own ON public.habits;
CREATE POLICY habits_restrict_to_own ON public.habits
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.habit_logs FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.habit_logs TO authenticated;

DROP POLICY IF EXISTS habit_logs_select_own ON public.habit_logs;
CREATE POLICY habit_logs_select_own ON public.habit_logs
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS habit_logs_insert_own ON public.habit_logs;
CREATE POLICY habit_logs_insert_own ON public.habit_logs
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS habit_logs_update_own ON public.habit_logs;
CREATE POLICY habit_logs_update_own ON public.habit_logs
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS habit_logs_delete_own ON public.habit_logs;
CREATE POLICY habit_logs_delete_own ON public.habit_logs
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS habit_logs_restrict_to_own ON public.habit_logs;
CREATE POLICY habit_logs_restrict_to_own ON public.habit_logs
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

NOTIFY pgrst, 'reload schema';
COMMIT;
