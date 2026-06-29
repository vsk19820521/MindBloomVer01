const fs = require('fs');
const path = require('path');
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });
}
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.log("No supabase url");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function run() {
  // Query test user
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', 'test')
    .single();
    
  console.log("TEST USER QUERY:", data, error);

  // Delete e2e test users
  const { data: e2eUsers, error: e2eError } = await supabase
    .from('users')
    .select('username')
    .like('username', 'e2e_test%');
    
  if (e2eUsers && e2eUsers.length > 0) {
    const usernames = e2eUsers.map(u => u.username);
    console.log("Found e2e users to delete:", usernames);
    const { error: delError } = await supabase
      .from('users')
      .delete()
      .in('username', usernames);
    console.log("Delete error:", delError);
  }
}

run();
