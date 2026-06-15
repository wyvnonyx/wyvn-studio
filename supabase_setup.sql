-- WYVN Studio — Supabase Schema
-- Run this in Supabase Dashboard > SQL Editor

-- Visitors tracking table
CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  sections_visited TEXT[] DEFAULT '{}',
  audit_url TEXT,
  audit_score INTEGER,
  time_on_page INTEGER DEFAULT 0,
  referrer TEXT,
  conversation JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT NOT NULL,
  company TEXT,
  url TEXT,
  goal TEXT,
  package TEXT,
  audit_score INTEGER,
  proposal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);
CREATE INDEX IF NOT EXISTS leads_created_idx ON leads(created_at DESC);

-- Enable RLS (optional - allows frontend reads)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by backend)
CREATE POLICY "service_all_leads" ON leads FOR ALL USING (true);
CREATE POLICY "service_all_visitors" ON visitors FOR ALL USING (true);

SELECT 'WYVN Supabase schema ready.' as status;
