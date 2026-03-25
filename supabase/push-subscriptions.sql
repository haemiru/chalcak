-- Push subscriptions table for 찰칵AI
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS chalcak_push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON chalcak_push_subscriptions(user_id);

-- RLS (service role only — no client-side access)
ALTER TABLE chalcak_push_subscriptions ENABLE ROW LEVEL SECURITY;
