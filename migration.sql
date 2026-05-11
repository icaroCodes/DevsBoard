-- 1. Create new table auth_accounts
CREATE TABLE IF NOT EXISTS auth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. No legacy data to migrate (provider/provider_id columns don't exist in users).
-- New OAuth logins will automatically populate auth_accounts via the backend.

-- 3. Clean up old tables (safe even if they don't exist)
DROP TABLE IF EXISTS user_identities;

-- 4. Modify users table
-- Ensure all remaining users have a username. If any has NULL, set to base of email
UPDATE users SET username = split_part(email, '@', 1) || '_' || substr(md5(random()::text), 1, 4) WHERE username IS NULL OR trim(username) = '';

-- Safe constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key') THEN
    ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
END $$;

ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- Keep display_name and backfill from name if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'display_name') THEN
    ALTER TABLE users ADD COLUMN display_name TEXT;
  END IF;
END $$;

-- Backfill display_name from name (only if name column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
    EXECUTE 'UPDATE users SET display_name = name WHERE display_name IS NULL AND name IS NOT NULL';
  END IF;
END $$;

-- Restore auth_id if it was accidentally dropped! It's needed for Realtime JWTs since id is BIGINT
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'auth_id') THEN
    ALTER TABLE users ADD COLUMN auth_id UUID DEFAULT gen_random_uuid() UNIQUE;
  END IF;
END $$;

-- Drop old columns (IF EXISTS makes this safe)
ALTER TABLE users 
  DROP COLUMN IF EXISTS password_hash,
  DROP COLUMN IF EXISTS provider,
  DROP COLUMN IF EXISTS provider_id,
  DROP COLUMN IF EXISTS name;

-- 5. Replace team_invitations with team_invites
CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invited_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  invited_username TEXT NOT NULL,
  invited_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TABLE IF EXISTS team_invitations;

-- Indexes
CREATE INDEX IF NOT EXISTS auth_accounts_user_id_idx ON auth_accounts(user_id);
CREATE INDEX IF NOT EXISTS team_invites_team_id_idx ON team_invites(team_id);
CREATE INDEX IF NOT EXISTS team_invites_invited_user_id_idx ON team_invites(invited_user_id);
CREATE INDEX IF NOT EXISTS team_invites_invited_username_idx ON team_invites(invited_username);
