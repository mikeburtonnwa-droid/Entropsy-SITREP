-- ============================================================================
-- Morning Brief Pipeline — Add morning_brief format
-- Migration: 003_add_morning_brief.sql
-- Description: Adds the morning_brief column to content_packages and updates
--              the published_content CHECK constraint to allow 'morning_brief'.
-- ============================================================================

-- Add morning_brief column to content_packages
ALTER TABLE content_packages ADD COLUMN morning_brief text NOT NULL DEFAULT '';

-- Update published_content CHECK constraint to allow 'morning_brief'
ALTER TABLE published_content DROP CONSTRAINT published_content_content_type_check;
ALTER TABLE published_content ADD CONSTRAINT published_content_content_type_check
  CHECK (content_type IN ('brief','morning_brief','linkedin','facebook','video_a','video_b','video_c'));
