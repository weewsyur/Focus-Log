-- Add structured names without removing or rewriting legacy display_name values.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS middle_name text,
  ADD COLUMN IF NOT EXISTS suffix text;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_first_last_name_required'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_first_last_name_required
      CHECK (
        first_name IS NOT NULL AND btrim(first_name) <> ''
        AND last_name IS NOT NULL AND btrim(last_name) <> ''
      ) NOT VALID;
  END IF;
END;
$migration$;

-- New auth users receive a profile row with structured name columns. Existing rows
-- and their legacy display_name values are left unchanged.
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
  INSERT INTO public.profiles (
    id, display_name, first_name, last_name, middle_name, suffix, default_focus_min, default_break_min
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

DO $migration$
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
$migration$;
