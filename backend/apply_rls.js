import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLS() {
  console.log("Applying RLS policies to missing tables...");

  const rlsScript = `
    -- Enforce RLS on all tables
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
    ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
    ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
    ALTER TABLE routine_tasks ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist (prevents errors on re-run)
    DROP POLICY IF EXISTS "Users can read their own profile" ON users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON users;
    
    DROP POLICY IF EXISTS "Users can read their own finances" ON finances;
    DROP POLICY IF EXISTS "Users can insert their own finances" ON finances;
    DROP POLICY IF EXISTS "Users can update their own finances" ON finances;
    DROP POLICY IF EXISTS "Users can delete their own finances" ON finances;

    DROP POLICY IF EXISTS "Users can read their own tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

    DROP POLICY IF EXISTS "Users can read their own goals" ON goals;
    DROP POLICY IF EXISTS "Users can insert their own goals" ON goals;
    DROP POLICY IF EXISTS "Users can update their own goals" ON goals;
    DROP POLICY IF EXISTS "Users can delete their own goals" ON goals;

    DROP POLICY IF EXISTS "Users can read their own routines" ON routines;
    DROP POLICY IF EXISTS "Users can insert their own routines" ON routines;
    DROP POLICY IF EXISTS "Users can update their own routines" ON routines;
    DROP POLICY IF EXISTS "Users can delete their own routines" ON routines;

    DROP POLICY IF EXISTS "Users can read their own routine_tasks" ON routine_tasks;
    DROP POLICY IF EXISTS "Users can insert their own routine_tasks" ON routine_tasks;
    DROP POLICY IF EXISTS "Users can update their own routine_tasks" ON routine_tasks;
    DROP POLICY IF EXISTS "Users can delete their own routine_tasks" ON routine_tasks;

    -- USERS: Users can read and update their own profiles
    CREATE POLICY "Users can read their own profile" ON users FOR SELECT USING (auth.uid() = auth_id);
    CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = auth_id);

    -- FINANCES: Users can CRUD their own finances where team_id is null
    CREATE POLICY "Users can read their own finances" ON finances FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL);
    CREATE POLICY "Users can insert their own finances" ON finances FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL);
    CREATE POLICY "Users can update their own finances" ON finances FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL);
    CREATE POLICY "Users can delete their own finances" ON finances FOR DELETE USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL);

    -- TASKS: Users can CRUD their own tasks where team_id is null
    CREATE POLICY "Users can read their own tasks" ON tasks FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL);
    CREATE POLICY "Users can insert their own tasks" ON tasks FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL);
    CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL);
    CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL);

    -- GOALS: Users can CRUD their own goals where team_id is null
    CREATE POLICY "Users can read their own goals" ON goals FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL);
    CREATE POLICY "Users can insert their own goals" ON goals FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL);
    CREATE POLICY "Users can update their own goals" ON goals FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL);
    CREATE POLICY "Users can delete their own goals" ON goals FOR DELETE USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL);

    -- ROUTINES: Users can CRUD their own routines where team_id is null
    CREATE POLICY "Users can read their own routines" ON routines FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL);
    CREATE POLICY "Users can insert their own routines" ON routines FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL);
    CREATE POLICY "Users can update their own routines" ON routines FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL);
    CREATE POLICY "Users can delete their own routines" ON routines FOR DELETE USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL);

    -- ROUTINE_TASKS: Users can CRUD their own routine_tasks
    CREATE POLICY "Users can read their own routine_tasks" ON routine_tasks FOR SELECT USING (routine_id IN (SELECT id FROM routines WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL));
    CREATE POLICY "Users can insert their own routine_tasks" ON routine_tasks FOR INSERT WITH CHECK (routine_id IN (SELECT id FROM routines WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL));
    CREATE POLICY "Users can update their own routine_tasks" ON routine_tasks FOR UPDATE USING (routine_id IN (SELECT id FROM routines WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL));
    CREATE POLICY "Users can delete their own routine_tasks" ON routine_tasks FOR DELETE USING (routine_id IN (SELECT id FROM routines WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND team_id IS NULL));
  `;

  const { error } = await supabase.rpc('exec_sql', { sql: rlsScript });

  if (error) {
    if (error.code === '42883') {
      console.log("Supabase RPC 'exec_sql' not found. Please run this SQL script manually in the Supabase Dashboard SQL Editor.");
      console.log("---- COPY AND PASTE THIS ----\n");
      console.log(rlsScript);
    } else {
      console.error("Error applying RLS policies:", error);
    }
  } else {
    console.log("RLS policies applied successfully!");
  }
}

applyRLS();
