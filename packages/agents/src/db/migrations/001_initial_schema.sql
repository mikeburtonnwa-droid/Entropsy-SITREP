-- ============================================================================
-- Morning Brief Pipeline — Initial Schema
-- Migration: 001_initial_schema.sql
-- Description: Creates the 8 core tables, indexes, and RLS policies.
-- ============================================================================

-- 1. pipeline_runs
-- Tracks each daily pipeline execution and its aggregate outcome.
-- ============================================================================
CREATE TABLE pipeline_runs (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date              date        NOT NULL,
  trigger_time          timestamptz NOT NULL DEFAULT now(),
  status                text        NOT NULL CHECK (status IN (
                          'SCHEDULED','HARVESTING','CURATING','WRITING',
                          'QA_REVIEW','PUBLISHING','COMPLETE','PARTIAL','FAILED'
                        )),
  industries_completed  text[]      DEFAULT '{}',
  industries_failed     text[]      DEFAULT '{}',
  total_pieces_published integer    DEFAULT 0,
  duration_ms           integer,
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX idx_pipeline_runs_date_status
  ON pipeline_runs (run_date, status);

-- 2. source_registry
-- Canonical list of every feed / scrape target the Harvest Agent may query.
-- ============================================================================
CREATE TABLE source_registry (
  id                   uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  industry             text    NOT NULL CHECK (industry IN (
                         'professional_services','financial_services',
                         'retail_ecommerce','universal'
                       )),
  source_name          text    NOT NULL,
  feed_url             text    NOT NULL,
  source_type          text    NOT NULL CHECK (source_type IN (
                         'rss','web_scrape','web_search'
                       )),
  active               boolean     DEFAULT true,
  avg_stories_per_day  real        DEFAULT 0,
  avg_relevance_score  real        DEFAULT 0,
  last_fetched         timestamptz,
  created_at           timestamptz DEFAULT now(),

  UNIQUE (industry, source_name)
);

-- 3. harvest_results
-- Raw stories pulled in by the Harvest Agent for a given run + industry.
-- ============================================================================
CREATE TABLE harvest_results (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id              uuid        NOT NULL REFERENCES pipeline_runs (id),
  industry            text        NOT NULL,
  source_name         text        NOT NULL,
  story_headline      text        NOT NULL,
  story_url           text        NOT NULL,
  publish_date        timestamptz,
  snippet             text,
  raw_text            text,
  relevance_pre_score real        DEFAULT 0,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_harvest_results_run_industry
  ON harvest_results (run_id, industry);

-- 4. curated_stories
-- Ranked, annotated stories selected by the Curator Agent.
-- ============================================================================
CREATE TABLE curated_stories (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          uuid        NOT NULL REFERENCES pipeline_runs (id),
  industry        text        NOT NULL,
  rank            integer     NOT NULL,
  headline        text        NOT NULL,
  url             text        NOT NULL,
  source          text        NOT NULL,
  why_selected    text,
  key_insight     text,
  story_angle     text,
  freshness_score real        DEFAULT 0,
  relevance_score real        DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_curated_stories_run_industry
  ON curated_stories (run_id, industry);

-- 5. content_packages
-- Full multi-format content produced by the Writer Agent for each story.
-- ============================================================================
CREATE TABLE content_packages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          uuid        NOT NULL REFERENCES pipeline_runs (id),
  industry        text        NOT NULL,
  story_id        uuid        NOT NULL REFERENCES curated_stories (id),
  brief_block     text        NOT NULL,
  linkedin_post   text        NOT NULL,
  facebook_post   text        NOT NULL,
  video_script_a  text        NOT NULL,
  video_script_b  text        NOT NULL,
  video_script_c  text        NOT NULL,
  word_counts     jsonb       NOT NULL DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_content_packages_run_industry
  ON content_packages (run_id, industry);

-- 6. qa_results
-- QA Agent verdicts and optional revisions for each content package.
-- ============================================================================
CREATE TABLE qa_results (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          uuid        NOT NULL REFERENCES pipeline_runs (id),
  content_id      uuid        NOT NULL REFERENCES content_packages (id),
  status          text        NOT NULL CHECK (status IN (
                    'PASS','REVISE','ESCALATE'
                  )),
  issues_found    jsonb       DEFAULT '[]',
  revised_content jsonb,
  qa_agent_notes  text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_qa_results_run_status
  ON qa_results (run_id, status);

-- 7. published_content
-- Final, client-visible content rows with delivery-queue flags.
-- ============================================================================
CREATE TABLE published_content (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            uuid        NOT NULL REFERENCES pipeline_runs (id),
  industry          text        NOT NULL,
  content_type      text        NOT NULL CHECK (content_type IN (
                      'brief','linkedin','facebook',
                      'video_a','video_b','video_c'
                    )),
  title             text        NOT NULL,
  body              text        NOT NULL,
  feed_url          text,
  linkedin_queued   boolean     DEFAULT false,
  facebook_queued   boolean     DEFAULT false,
  video_added       boolean     DEFAULT false,
  publish_timestamp timestamptz DEFAULT now(),
  client_views      integer     DEFAULT 0
);

CREATE INDEX idx_published_content_run_industry_type
  ON published_content (run_id, industry, content_type);

-- 8. agent_run_log
-- Per-agent telemetry: timing, token usage, cost, and error tracking.
-- ============================================================================
CREATE TABLE agent_run_log (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id         uuid        NOT NULL REFERENCES pipeline_runs (id),
  agent_id       text        NOT NULL,
  agent_name     text        NOT NULL,
  started_at     timestamptz NOT NULL DEFAULT now(),
  completed_at   timestamptz,
  status         text        NOT NULL CHECK (status IN (
                   'RUNNING','SUCCESS','ERROR','TIMEOUT'
                 )),
  input_hash     text,
  output_summary text,
  error_message  text,
  tokens_used    integer     DEFAULT 0,
  cost_usd       real        DEFAULT 0
);

CREATE INDEX idx_agent_run_log_run_agent
  ON agent_run_log (run_id, agent_id);

-- ============================================================================
-- Row Level Security
-- Enable RLS on every table, then grant full access to the service_role so
-- back-end agents can read/write without restriction.  Client-facing policies
-- can be layered on later.
-- ============================================================================

ALTER TABLE pipeline_runs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_registry   ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_results   ENABLE ROW LEVEL SECURITY;
ALTER TABLE curated_stories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_packages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_results        ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_run_log     ENABLE ROW LEVEL SECURITY;

-- Permissive "allow everything" policies for the Supabase service_role.
-- The service_role bypasses RLS by default in Supabase, but explicit policies
-- make the intent clear and keep the schema self-documenting.

CREATE POLICY service_role_all ON pipeline_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON source_registry
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON harvest_results
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON curated_stories
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON content_packages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON qa_results
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON published_content
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON agent_run_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);
