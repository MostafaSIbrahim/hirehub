-- array_to_string() is marked STABLE in Postgres, not IMMUTABLE, and generated
-- columns only accept IMMUTABLE expressions. For text[] it IS deterministic,
-- so we wrap it in a function we're allowed to declare IMMUTABLE.
CREATE OR REPLACE FUNCTION hirehub_text_array_to_string(text[])
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$ SELECT coalesce(array_to_string($1, ' '), '') $$;

-- Generated column: Postgres recomputes it automatically on every INSERT/UPDATE.
ALTER TABLE "Job" ADD COLUMN "search" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('english', hirehub_text_array_to_string("skills")), 'B') ||
  setweight(to_tsvector('english', coalesce("description", '')), 'C')
) STORED;

-- Same index name Prisma expects, so it never sees "drift"
CREATE INDEX "Job_search_idx" ON "Job" USING GIN ("search");