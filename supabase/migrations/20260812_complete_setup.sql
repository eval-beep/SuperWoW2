-- ============================================
-- COMPLETE DATABASE SETUP (All-in-One)
-- Jalankan SEMUA ini dalam 1x execute di SQL Editor
-- Aman dijalankan berulang kali — tidak akan error
-- ============================================

-- ============================================
-- 1. CREATE TABLES (skip jika sudah ada)
-- ============================================

CREATE TABLE IF NOT EXISTS settings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

CREATE TABLE IF NOT EXISTS command_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  command_type TEXT NOT NULL,
  cloud_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trans_id INTEGER,
  endpoint TEXT,
  request_payload JSONB,
  response_payload JSONB,
  status TEXT NOT NULL DEFAULT 'failed',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  webhook_type TEXT NOT NULL,
  cloud_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trans_id INTEGER,
  raw_payload JSONB,
  status TEXT DEFAULT 'success',
  command_type_match BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS userinfos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cloud_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pin TEXT NOT NULL,
  name TEXT,
  password TEXT,
  privilege INTEGER DEFAULT 0,
  finger_count INTEGER DEFAULT 0,
  face_count INTEGER DEFAULT 0,
  rfid_count INTEGER DEFAULT 0,
  vein_count INTEGER DEFAULT 0,
  template TEXT,
  raw_payload JSONB,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attlogs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cloud_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pin TEXT NOT NULL,
  name TEXT,
  scan_time TIMESTAMPTZ,
  verify_method INTEGER,
  status_scan INTEGER DEFAULT 0,
  source TEXT DEFAULT 'api_pull',
  trans_id INTEGER,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pins (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cloud_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pin TEXT NOT NULL,
  name TEXT,
  retrieved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  nickname TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'login',
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ADD user_id COLUMNS (skip jika sudah ada)
-- ============================================

DO $$ BEGIN
  ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE attlogs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE command_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE userinfos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE pins ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- ============================================
-- 3. CONVERT trans_id TO INTEGER
-- ============================================

DO $$ BEGIN
  DELETE FROM command_logs WHERE trans_id::text !~ '^\d+$';
  ALTER TABLE command_logs ALTER COLUMN trans_id TYPE integer USING trans_id::integer;
EXCEPTION WHEN undefined_column THEN NULL; WHEN invalid_text_representation THEN NULL; WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE attlogs SET trans_id = NULL WHERE trans_id::text !~ '^\d+$';
  ALTER TABLE attlogs ALTER COLUMN trans_id TYPE integer USING trans_id::integer;
EXCEPTION WHEN undefined_column THEN NULL; WHEN invalid_text_representation THEN NULL; WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 4. ADD command_type_match
-- ============================================

DO $$ BEGIN
  ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS command_type_match boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- ============================================
-- 5. PROFILES TRIGGER (auto-create on signup)
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, nickname, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'nickname', COALESCE(NEW.raw_user_meta_data->>'full_name', '')),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 6. RLS POLICIES (drop dulu lalu buat ulang)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own OTP" ON otp_codes;
DROP POLICY IF EXISTS "Users can insert own OTP" ON otp_codes;
DROP POLICY IF EXISTS "Users can update own OTP" ON otp_codes;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own OTP" ON otp_codes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own OTP" ON otp_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own OTP" ON otp_codes
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 7. STORAGE (avatars bucket)
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- ============================================
-- 8. INDEXES (performa query)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_attlogs_user_id ON attlogs(user_id);
CREATE INDEX IF NOT EXISTS idx_attlogs_cloud_id ON attlogs(cloud_id);
CREATE INDEX IF NOT EXISTS idx_attlogs_scan_time ON attlogs(scan_time);
CREATE INDEX IF NOT EXISTS idx_command_logs_user_id ON command_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_command_logs_cloud_id ON command_logs(cloud_id);
CREATE INDEX IF NOT EXISTS idx_command_logs_trans_id ON command_logs(trans_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id ON webhook_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_cloud_id ON webhook_logs(cloud_id);
CREATE INDEX IF NOT EXISTS idx_userinfos_user_id ON userinfos(user_id);
CREATE INDEX IF NOT EXISTS idx_userinfos_cloud_pin ON userinfos(cloud_id, pin);
CREATE INDEX IF NOT EXISTS idx_pins_user_id ON pins(user_id);
CREATE INDEX IF NOT EXISTS idx_pins_cloud_id ON pins(cloud_id);
