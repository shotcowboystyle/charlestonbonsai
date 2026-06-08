-- Charleston Bonsai Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trees table
CREATE TABLE IF NOT EXISTS trees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  species VARCHAR(255) NOT NULL,
  tree_type VARCHAR(50) NOT NULL CHECK (tree_type IN ('ficus', 'juniper', 'maple', 'pine', 'elm', 'cedar', 'azalea', 'bamboo', 'other')),
  price DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  short_description VARCHAR(500) NOT NULL,
  care_level VARCHAR(20) NOT NULL CHECK (care_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  size VARCHAR(20) NOT NULL CHECK (size IN ('mini', 'small', 'medium', 'large', 'extra-large')),
  age INTEGER NOT NULL,
  height VARCHAR(50) NOT NULL,
  pot_type VARCHAR(100) NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  thumbnail VARCHAR(500) NOT NULL,
  model_3d_url VARCHAR(500),
  features TEXT[] NOT NULL DEFAULT '{}',
  in_stock BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_trees_slug ON trees(slug);
CREATE INDEX idx_trees_type ON trees(tree_type);
CREATE INDEX idx_trees_care_level ON trees(care_level);
CREATE INDEX idx_trees_size ON trees(size);
CREATE INDEX idx_trees_featured ON trees(featured);
CREATE INDEX idx_trees_in_stock ON trees(in_stock);

-- Admin users table (simple auth)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  last_password_change TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster token lookups
CREATE INDEX idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);

-- Insert default admin user
-- Password: 'admin123' (change this in production!)
-- Hash generated with bcrypt, cost factor 10
INSERT INTO admin_users (email, password_hash)
VALUES ('curt.blanton@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public can read trees
CREATE POLICY "Trees are viewable by everyone" ON trees
  FOR SELECT USING (true);

-- Only authenticated admin can modify trees
CREATE POLICY "Admin can manage trees" ON trees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Admin users table is private
CREATE POLICY "Admin users private" ON admin_users
  FOR ALL USING (false);

-- Password reset tokens are private
CREATE POLICY "Reset tokens private" ON password_reset_tokens
  FOR ALL USING (false);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on trees
CREATE TRIGGER update_trees_updated_at
    BEFORE UPDATE ON trees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions for anon key access.
-- Anon SELECT is column-scoped: `price` is intentionally omitted so the
-- public anon key (shipped in client bundles) cannot read pricing via a
-- raw REST call. Server-side endpoints that need price use the service
-- key (see server/api/admin/listings/*). Pricing is "by inquiry only" —
-- see TODO.md history and server/api/trees/list.get.ts.
GRANT SELECT (
  id, name, slug, species, tree_type, description, short_description,
  care_level, size, age, height, pot_type, images, thumbnail,
  model_3d_url, features, in_stock, featured, created_at, updated_at
) ON trees TO anon;
GRANT SELECT ON trees TO authenticated;

-- Newsletter subscribers (double-opt-in).
-- email is stored lowercased; unique index enforces one row per address.
-- status: 'pending' until the user clicks the confirmation link, then
--         'confirmed'; 'unsubscribed' after they opt out.
-- confirmation_token_hash: sha256 of the token emailed out (single-use,
--         24h TTL via confirmation_expires_at). Raw token never persisted.
-- unsubscribe_token: opaque random string sent in every email so any link
--         can opt out without authentication.
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  confirmation_token_hash VARCHAR(64),
  confirmation_expires_at TIMESTAMP WITH TIME ZONE,
  unsubscribe_token VARCHAR(64) NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  source VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_confirmation_hash
  ON subscribers(confirmation_token_hash);
CREATE INDEX IF NOT EXISTS idx_subscribers_unsubscribe_token
  ON subscribers(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers private" ON subscribers
  FOR ALL USING (false);

CREATE TRIGGER update_subscribers_updated_at
    BEFORE UPDATE ON subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Event rental inquiries (one submission = one row).
-- Each row is an immutable record of a single inquiry from the /events
-- landing page. Email is stored lowercased. RLS denies all client access;
-- server-side endpoints use the service key.
-- event_type values are constrained to the form's select options.
-- headcount and table_count are optional and stored as smallint to keep
-- the table compact (event sizes don't realistically exceed int2 range).
CREATE TABLE IF NOT EXISTS event_inquiries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  event_date DATE NOT NULL,
  location VARCHAR(255) NOT NULL,
  event_type VARCHAR(30) NOT NULL
    CHECK (event_type IN ('wedding', 'private_dinner', 'hospitality', 'corporate', 'other')),
  headcount SMALLINT,
  table_count SMALLINT,
  notes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_inquiries_created_at
  ON event_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_inquiries_event_date
  ON event_inquiries(event_date);

ALTER TABLE event_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event inquiries private" ON event_inquiries
  FOR ALL USING (false);

-- Mountain retreat inquiries (one submission = one row).
-- Same posture as event_inquiries: immutable single-row records from the
-- /retreats landing page, email lowercased, RLS denies all client access,
-- writes go through server-side endpoints with the service key.
-- preferred_dates is free-form text ("Late September", "Oct 10-14") because
-- the actual date negotiation happens over email after first contact.
-- party_size is capped at 6 — the mountain house tops out there.
CREATE TABLE IF NOT EXISTS retreat_inquiries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  preferred_dates VARCHAR(120) NOT NULL,
  party_size SMALLINT NOT NULL CHECK (party_size BETWEEN 1 AND 6),
  package_type VARCHAR(20) NOT NULL
    CHECK (package_type IN ('weekend', 'immersion', 'private', 'undecided')),
  skill_level VARCHAR(20) NOT NULL
    CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  notes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retreat_inquiries_created_at
  ON retreat_inquiries(created_at DESC);

ALTER TABLE retreat_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Retreat inquiries private" ON retreat_inquiries
  FOR ALL USING (false);
