import supabase from './src/database/connection.js';

const { error } = await supabase.rpc('exec_sql', {
  sql: 'ALTER TABLE project_comments ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES project_comments(id) ON DELETE CASCADE'
});

if (error) {
  console.log('RPC not available. Please run this SQL in Supabase Dashboard SQL editor:');
  console.log('ALTER TABLE project_comments ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES project_comments(id) ON DELETE CASCADE');
  console.log('Error:', error.message);
} else {
  console.log('Column parent_id added successfully!');
}

process.exit(0);
