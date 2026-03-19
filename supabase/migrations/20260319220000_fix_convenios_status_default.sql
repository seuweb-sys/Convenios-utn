-- Fix triple-quoted default that produced invalid status values on INSERT
-- (was: '''enviado''::text'::text → literal string containing quotes, not 'enviado')
ALTER TABLE public.convenios
  ALTER COLUMN status SET DEFAULT 'enviado'::text;
