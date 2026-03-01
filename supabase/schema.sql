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

-- Grant permissions for anon key access
GRANT SELECT ON trees TO anon;
GRANT SELECT ON trees TO authenticated;
