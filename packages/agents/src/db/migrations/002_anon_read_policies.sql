-- Allow the anon (public) role to read published content and pipeline runs
-- This enables the Next.js feed UI to query data using the anon key

CREATE POLICY anon_read_published
  ON published_content
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY anon_read_runs
  ON pipeline_runs
  FOR SELECT
  TO anon
  USING (true);
