-- Supabase Database Schema for Grant Union Investment Migration
-- Run this SQL in your Supabase SQL Editor

-- Note: This version does not drop existing tables to avoid data loss
-- It creates tables and adds columns only if they don't exist

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create userlogs table (equivalent to Firestore userlogs collection)
CREATE TABLE IF NOT EXISTS userlogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  user_name TEXT,
  phone TEXT,
  country TEXT,
  city TEXT,
  mailing_address TEXT,
  username_locked BOOLEAN DEFAULT FALSE,
  password TEXT, -- Note: In production, use Supabase Auth instead
  idnum INTEGER UNIQUE,
  balance DECIMAL(15,2) DEFAULT 0,
  bonus DECIMAL(15,2) DEFAULT 0,
  referral_code TEXT UNIQUE,
  referral_code_issued_at TIMESTAMPTZ,
  referral_code_expires_at TIMESTAMPTZ,
  referral_level INTEGER DEFAULT 0,
  referral_count INTEGER DEFAULT 0,
  referral_bonus_total DECIMAL(15,2) DEFAULT 0,
  referred_by_code TEXT,
  referred_by_idnum INTEGER REFERENCES userlogs(idnum),
  authstatus TEXT DEFAULT 'unseen',
  avatar TEXT DEFAULT 'avatar_1',
  account_status TEXT DEFAULT 'active',
  admin BOOLEAN DEFAULT FALSE,
  kyc_status TEXT DEFAULT 'pending',
  kyc_submitted_at TIMESTAMPTZ,
  date_created DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idnum INTEGER NOT NULL REFERENCES userlogs(idnum),
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  capital DECIMAL(15,2) DEFAULT 0,
  roi DECIMAL(15,2) DEFAULT 0,
  bonus DECIMAL(15,2) DEFAULT 0,
  credited_roi DECIMAL(15,2) DEFAULT 0,
  credited_bonus DECIMAL(15,2) DEFAULT 0,
  duration INTEGER DEFAULT 5,
  paymentoption TEXT DEFAULT 'Bitcoin',
  authstatus TEXT DEFAULT 'unseen',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idnum INTEGER NOT NULL REFERENCES userlogs(idnum),
  title TEXT,
  message TEXT,
  status TEXT DEFAULT 'unseen',
  type TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create kyc table
CREATE TABLE IF NOT EXISTS kyc (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- References userlogs.id
  idnum INTEGER,
  user_name TEXT,
  id_type TEXT,
  id_number TEXT,
  id_url TEXT,
  selfie_url TEXT,
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create loans table (if used)
CREATE TABLE IF NOT EXISTS loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idnum INTEGER NOT NULL REFERENCES userlogs(idnum),
  user_id TEXT,
  user_name TEXT,
  amount DECIMAL(15,2),
  purpose TEXT,
  employment_status TEXT,
  employer TEXT,
  monthly_income DECIMAL(15,2),
  payment_frequency TEXT DEFAULT 'Monthly',
  employment_duration TEXT,
  previous_loans TEXT DEFAULT 'No',
  collateral TEXT DEFAULT 'No',
  collateral_type TEXT,
  collateral_value DECIMAL(15,2),
  credit_score TEXT,
  "references" JSONB,
  bank_name TEXT,
  account_number TEXT,
  account_type TEXT DEFAULT 'Savings',
  residential_status TEXT,
  monthly_rent DECIMAL(15,2),
  residence_duration TEXT,
  status TEXT DEFAULT 'Pending',
  interest_rate DECIMAL(5,2),
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idnum INTEGER NOT NULL REFERENCES userlogs(idnum),
  amount DECIMAL(15,2),
  status TEXT DEFAULT 'pending',
  paymentoption TEXT,
  wallet_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chats table for chatbot functionality
CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- References user identifier (idnum or id)
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create withdrawal_codes table for withdrawal functionality
CREATE TABLE IF NOT EXISTS withdrawal_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  user_id TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active'
);

-- Create referrals table for referral relationships and payouts
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  referrer_id UUID REFERENCES userlogs(id) ON DELETE SET NULL,
  referrer_idnum INTEGER REFERENCES userlogs(idnum) ON DELETE SET NULL,
  referred_user_id UUID REFERENCES userlogs(id) ON DELETE SET NULL,
  referred_idnum INTEGER REFERENCES userlogs(idnum) ON DELETE SET NULL,
  parent_referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
  level INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  reward_amount DECIMAL(15,2) DEFAULT 0,
  bonus_amount DECIMAL(15,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track referral reward ledger for auditing payouts
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
  referrer_idnum INTEGER REFERENCES userlogs(idnum) ON DELETE SET NULL,
  referred_idnum INTEGER REFERENCES userlogs(idnum) ON DELETE SET NULL,
  reward_type TEXT DEFAULT 'bonus',
  reward_amount DECIMAL(15,2) DEFAULT 0,
  bonus_amount DECIMAL(15,2) DEFAULT 0,
  level INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_userlogs_email ON userlogs(email);
CREATE INDEX idx_userlogs_idnum ON userlogs(idnum);
CREATE INDEX idx_investments_idnum ON investments(idnum);
CREATE INDEX idx_notifications_idnum ON notifications(idnum);
CREATE INDEX idx_kyc_user_id ON kyc(user_id);
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_timestamp ON chats(timestamp);
CREATE INDEX idx_userlogs_referral_code ON userlogs(referral_code);
CREATE INDEX idx_userlogs_referred_by ON userlogs(referred_by_idnum);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_referrer_idnum ON referrals(referrer_idnum);
CREATE INDEX idx_referrals_referred_idnum ON referrals(referred_idnum);
CREATE INDEX idx_referral_rewards_ref_id ON referral_rewards(referral_id);

-- Enable Row Level Security (RLS)
ALTER TABLE userlogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
-- For now, allow all operations (you should restrict these in production)
DROP POLICY IF EXISTS "Allow all operations on userlogs" ON userlogs;
DROP POLICY IF EXISTS "Allow all operations on investments" ON investments;
DROP POLICY IF EXISTS "Allow all operations on notifications" ON notifications;
DROP POLICY IF EXISTS "Allow all operations on kyc" ON kyc;
DROP POLICY IF EXISTS "Allow all operations on loans" ON loans;
DROP POLICY IF EXISTS "Allow all operations on withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Allow all operations on chats" ON chats;
DROP POLICY IF EXISTS "Allow all operations on referrals" ON referrals;
DROP POLICY IF EXISTS "Allow all operations on referral_rewards" ON referral_rewards;

CREATE POLICY "Allow all operations on userlogs" ON userlogs FOR ALL USING (true);
CREATE POLICY "Allow all operations on investments" ON investments FOR ALL USING (true);
CREATE POLICY "Allow all operations on notifications" ON notifications FOR ALL USING (true);
CREATE POLICY "Allow all operations on kyc" ON kyc FOR ALL USING (true);
CREATE POLICY "Allow all operations on loans" ON loans FOR ALL USING (true);
CREATE POLICY "Allow all operations on withdrawals" ON withdrawals FOR ALL USING (true);
CREATE POLICY "Allow all operations on chats" ON chats FOR ALL USING (true);
CREATE POLICY "Allow all operations on withdrawal_codes" ON withdrawal_codes FOR ALL USING (true);
CREATE POLICY "Allow all operations on referrals" ON referrals FOR ALL USING (true);
CREATE POLICY "Allow all operations on referral_rewards" ON referral_rewards FOR ALL USING (true);

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', true);

-- Create storage bucket for user avatars (if needed)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Storage policies (allow authenticated users to upload)
CREATE POLICY "Allow authenticated users to upload KYC documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'kyc-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public access to KYC documents" ON storage.objects
FOR SELECT USING (bucket_id = 'kyc-documents');

CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public access to avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Add missing columns if they don't exist (for existing databases)
ALTER TABLE userlogs ADD COLUMN IF NOT EXISTS phone TEXT;