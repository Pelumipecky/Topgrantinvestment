-- Add contact information columns to userlogs table
ALTER TABLE userlogs ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE userlogs ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE userlogs ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE userlogs ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE userlogs ADD COLUMN IF NOT EXISTS mailing_address TEXT;
ALTER TABLE userlogs ADD COLUMN IF NOT EXISTS username_locked BOOLEAN DEFAULT FALSE;
