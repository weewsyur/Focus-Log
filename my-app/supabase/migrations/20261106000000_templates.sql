BEGIN;

CREATE OR REPLACE FUNCTION public.is_valid_template_config(config jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  focus_minutes numeric;
  break_minutes numeric;
BEGIN
  IF jsonb_typeof(config) <> 'object' THEN
    RETURN false;
  END IF;
  IF jsonb_object_length(config) <> 3 OR NOT (config ?& ARRAY['subject', 'focusMin', 'breakMin']) THEN
    RETURN false;
  END IF;
  IF jsonb_typeof(config->'subject') <> 'string'
    OR jsonb_typeof(config->'focusMin') <> 'number'
    OR jsonb_typeof(config->'breakMin') <> 'number' THEN
    RETURN false;
  END IF;

  IF char_length(btrim(config->>'subject')) NOT BETWEEN 1 AND 60 THEN
    RETURN false;
  END IF;

  focus_minutes := (config->>'focusMin')::numeric;
  break_minutes := (config->>'breakMin')::numeric;
  RETURN focus_minutes = trunc(focus_minutes) AND focus_minutes BETWEEN 1 AND 180
    AND break_minutes = trunc(break_minutes) AND break_minutes BETWEEN 0 AND 60;
END;
$$;

CREATE TABLE IF NOT EXISTS public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (name = btrim(name) AND char_length(name) BETWEEN 1 AND 60),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 200),
  is_preset boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL CHECK (public.is_valid_template_config(config)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT templates_owner_type_check CHECK (
    (is_preset AND user_id IS NULL) OR (NOT is_preset AND user_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS templates_user_name_unique_idx
  ON public.templates (user_id, lower(name))
  WHERE NOT is_preset;
CREATE UNIQUE INDEX IF NOT EXISTS templates_preset_name_unique_idx
  ON public.templates (lower(name))
  WHERE is_preset;
CREATE INDEX IF NOT EXISTS templates_user_id_idx ON public.templates (user_id);

GRANT USAGE ON SCHEMA public TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_template_custom_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  template_count integer;
BEGIN
  IF NEW.is_preset THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.user_id = OLD.user_id AND NOT OLD.is_preset THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 0));
  SELECT count(*) INTO template_count
  FROM public.templates
  WHERE user_id = NEW.user_id AND NOT is_preset;

  IF template_count >= 50 THEN
    RAISE EXCEPTION 'You can save up to 50 custom templates.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS templates_custom_limit ON public.templates;
CREATE TRIGGER templates_custom_limit
  BEFORE INSERT OR UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.enforce_template_custom_limit();

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.templates FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.templates TO authenticated;

DROP POLICY IF EXISTS templates_select_accessible ON public.templates;
CREATE POLICY templates_select_accessible ON public.templates
  FOR SELECT TO authenticated
  USING (is_preset OR (SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS templates_insert_own ON public.templates;
CREATE POLICY templates_insert_own ON public.templates
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id AND NOT is_preset);

DROP POLICY IF EXISTS templates_update_own ON public.templates;
CREATE POLICY templates_update_own ON public.templates
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id AND NOT is_preset)
  WITH CHECK ((SELECT auth.uid()) = user_id AND NOT is_preset);

DROP POLICY IF EXISTS templates_delete_own ON public.templates;
CREATE POLICY templates_delete_own ON public.templates
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id AND NOT is_preset);

NOTIFY pgrst, 'reload schema';
COMMIT;
