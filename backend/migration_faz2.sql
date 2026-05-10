-- Faz 2 Migration — Push Notifications + Job Alerts
-- VPS'te çalıştır: psql $DATABASE_URL < migration_faz2.sql
-- veya Supabase SQL Editor'da çalıştır

-- 1. profiles tablosuna push_token ekle
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS push_token TEXT;

-- 2. job_alerts tablosu
CREATE TABLE IF NOT EXISTS job_alerts (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL,
  label       TEXT        NOT NULL DEFAULT '',
  keyword     TEXT        NOT NULL DEFAULT '',
  location    TEXT        NOT NULL DEFAULT 'Istanbul, Turkey',
  work_type   TEXT        NOT NULL DEFAULT 'any',
  seniority   TEXT[]      NOT NULL DEFAULT '{}',
  sectors     TEXT[]      NOT NULL DEFAULT '{}',
  enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. user_id üzerinde index (hız)
CREATE INDEX IF NOT EXISTS job_alerts_user_id_idx ON job_alerts (user_id);
