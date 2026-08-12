-- Migration: Add user_id to all tables for per-user data isolation
-- Run this in Supabase SQL Editor

-- settings (may already have user_id from earlier)
DO $$ BEGIN
  ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- attlogs
DO $$ BEGIN
  ALTER TABLE attlogs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_attlogs_user_id ON attlogs(user_id);

-- command_logs
DO $$ BEGIN
  ALTER TABLE command_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_command_logs_user_id ON command_logs(user_id);

-- webhook_logs
DO $$ BEGIN
  ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id ON webhook_logs(user_id);

-- userinfos
DO $$ BEGIN
  ALTER TABLE userinfos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_userinfos_user_id ON userinfos(user_id);

-- pins
DO $$ BEGIN
  ALTER TABLE pins ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_pins_user_id ON pins(user_id);
