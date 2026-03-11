-- Supabase Schema for XPAY Bot
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  twitter_id TEXT UNIQUE NOT NULL,
  twitter_handle TEXT NOT NULL,
  twitter_avatar TEXT,
  solana_address TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rain events table
CREATE TABLE rain_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_twitter_id TEXT NOT NULL REFERENCES users(twitter_id),
  tweet_id TEXT NOT NULL,
  tweet_text TEXT,
  token TEXT NOT NULL,
  token_ca TEXT,
  total_amount NUMERIC NOT NULL,
  per_user_amount NUMERIC NOT NULL,
  recipient_count INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'refunded')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Claims table
CREATE TABLE claims (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rain_event_id UUID NOT NULL REFERENCES rain_events(id) ON DELETE CASCADE,
  receiver_twitter_id TEXT NOT NULL,
  receiver_solana TEXT,
  amount NUMERIC NOT NULL,
  token TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired')),
  claimed_at TIMESTAMPTZ,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'claim', 'refund', 'fee')),
  rain_event_id UUID REFERENCES rain_events(id),
  claim_id UUID REFERENCES claims(id),
  from_address TEXT,
  to_address TEXT,
  amount NUMERIC NOT NULL,
  token TEXT NOT NULL,
  tx_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_users_twitter_id ON users(twitter_id);
CREATE INDEX idx_users_solana_address ON users(solana_address);
CREATE INDEX idx_rain_events_sender ON rain_events(sender_twitter_id);
CREATE INDEX idx_rain_events_status ON rain_events(status);
CREATE INDEX idx_rain_events_created ON rain_events(created_at DESC);
CREATE INDEX idx_claims_rain_event ON claims(rain_event_id);
CREATE INDEX idx_claims_receiver ON claims(receiver_twitter_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_transactions_rain ON transactions(rain_event_id);
CREATE INDEX idx_transactions_claim ON transactions(claim_id);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (twitter_id = current_setting('app.current_user', TRUE));

CREATE POLICY "Rain events are publicly viewable" ON rain_events
  FOR SELECT USING (TRUE);

CREATE POLICY "Claims are viewable by receiver" ON claims
  FOR SELECT USING (receiver_twitter_id = current_setting('app.current_user', TRUE));

CREATE POLICY "Transactions are viewable by related users" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rain_events re 
      WHERE re.id = transactions.rain_event_id 
      AND re.sender_twitter_id = current_setting('app.current_user', TRUE)
    ) OR
    EXISTS (
      SELECT 1 FROM claims c 
      WHERE c.id = transactions.claim_id 
      AND c.receiver_twitter_id = current_setting('app.current_user', TRUE)
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Get leaderboard function
CREATE OR REPLACE FUNCTION get_top_claimers(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  twitter_handle TEXT,
  total_claimed NUMERIC,
  claim_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.receiver_twitter_id as twitter_handle,
    SUM(c.amount) as total_claimed,
    COUNT(*) as claim_count
  FROM claims c
  WHERE c.status = 'claimed'
  GROUP BY c.receiver_twitter_id
  ORDER BY total_claimed DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;