-- 1. ubah command_logs.trans_id ke integer
DELETE FROM command_logs WHERE trans_id != '1';
ALTER TABLE command_logs ALTER COLUMN trans_id TYPE integer USING trans_id::integer;

-- 2. ubah attlogs.trans_id ke integer
UPDATE attlogs SET trans_id = NULL WHERE trans_id = '' OR trans_id = '99';
ALTER TABLE attlogs ALTER COLUMN trans_id TYPE integer USING trans_id::integer;

-- 3. tambah kolom command_type_match di webhook_logs
ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS command_type_match boolean DEFAULT false;
