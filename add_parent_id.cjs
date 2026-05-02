const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('./backend/.env', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(l => {
  const i = l.indexOf('=');
  if (i > 0) {
    const k = l.substring(0, i).trim();
    env[k] = l.substring(i + 1).trim().replace(/^["']|["']$/g, '');
  }
});

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function run() {
  // Try adding parent_id column via REST (Supabase accepts it if column exists)
  // We'll just test by inserting — if parent_id doesn't exist as column, it will be ignored
  const { error } = await sb.rpc('exec_sql', {
    sql: 'ALTER TABLE project_comments ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES project_comments(id) ON DELETE CASCADE'
  });
  
  if (error) {
    console.log('RPC not available (expected on hosted Supabase). Add parent_id column manually in Supabase Dashboard:');
    console.log('ALTER TABLE project_comments ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES project_comments(id) ON DELETE CASCADE');
    console.log('Error:', error.message);
  } else {
    console.log('Column parent_id added successfully!');
  }
}

run();
