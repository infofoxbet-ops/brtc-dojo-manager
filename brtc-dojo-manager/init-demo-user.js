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

async function init() {
  const email = 'admin@dojo.it';
  const password = 'password123';

  let { data: user, error: uErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  let userId = user?.user?.id;

  if (uErr) {
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users?.find(u => u.email === email);
    userId = existing?.id;
  }

  console.log('Admin user ID:', userId);

  // Check or create org
  let { data: org } = await supabase.from('organizations').select('id').single();
  if (!org) {
    const { data: newOrg } = await supabase.from('organizations').insert({
      name: 'Dojo Karate BRTC',
      slug: 'dojo-karate-brtc'
    }).select().single();
    org = newOrg;
  }
  console.log('Org ID:', org?.id);

  // Link role
  const { data: role } = await supabase.from('user_roles').select('*').eq('user_id', userId).single();
  if (!role && org?.id && userId) {
    await supabase.from('user_roles').insert({
      user_id: userId,
      role: 'super-admin',
      organization_id: org.id
    });
  }
  console.log('✅ Demo account ready! Email:', email, 'Password:', password);
}

init();
