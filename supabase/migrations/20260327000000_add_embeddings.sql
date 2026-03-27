-- Enable pgvector extension for embedding storage and similarity search
create extension if not exists vector with schema extensions;

-- Add embedding column to feature_requests
alter table feature_requests
  add column if not exists embedding vector(3072);

-- Drop existing function if signature differs (safe — immediately recreated below)
drop function if exists match_requests(vector, float, int, uuid);
drop function if exists match_requests(vector, double precision, integer, uuid);

-- Create similarity search function used by semantic search API
create or replace function match_requests(
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  p_workspace_id uuid
)
returns table (
  id uuid,
  title text,
  description text,
  status text,
  category text,
  rice_score float,
  created_at timestamptz,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    fr.id,
    fr.title,
    fr.description,
    fr.status,
    fr.category,
    fr.rice_score::float,
    fr.created_at,
    1 - (fr.embedding <=> query_embedding) as similarity
  from feature_requests fr
  where fr.workspace_id = p_workspace_id
    and fr.embedding is not null
    and 1 - (fr.embedding <=> query_embedding) > match_threshold
  order by fr.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Index for fast vector similarity lookups
create index if not exists feature_requests_embedding_idx
  on feature_requests
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
