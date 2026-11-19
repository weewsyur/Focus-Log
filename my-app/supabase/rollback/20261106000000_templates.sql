BEGIN;

DROP TABLE IF EXISTS public.templates CASCADE;
DROP FUNCTION IF EXISTS public.enforce_template_custom_limit();
DROP FUNCTION IF EXISTS public.is_valid_template_config(jsonb);

COMMIT;
