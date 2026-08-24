const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const tables = ['organizations', 'locations', 'athletes', 'attendance', 'tournaments', 'exam_sessions', 'tournament_matches', 'exam_candidates', 'athlete_belt_history'];
  console.log('Testing connection to:', env.NEXT_PUBLIC_SUPABASE_URL);
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ Table ${t}: ERROR ->`, error.message);
    } else {
      console.log(`✅ Table ${t}: OK (records: ${count})`);
    }
  }
}

test();
