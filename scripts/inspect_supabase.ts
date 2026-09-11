import dotenv from 'dotenv';
dotenv.config();

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'bsmvuuemijrjoqvzzdvh';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function query(sql: string) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  return res.json();
}

async function main() {
  console.log('--- ResQ Supabase Security & Advisory Inspection ---');

  const policies = await query(`
    SELECT tablename, policyname, roles, cmd, with_check 
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);
  console.log('\nActive RLS Policies:');
  console.table(policies);

  const procs = await query(`
    SELECT proname, proconfig 
    FROM pg_proc 
    WHERE proname IN ('fn_allocate_asset', 'fn_handle_asset_degradation', 'fn_update_allocation_status', 'fn_refresh_equity')
      AND pronamespace = 'public'::regnamespace;
  `);
  console.log('\nFunction Configuration (search_path):');
  console.table(procs);

  const mvGrants = await query(`
    SELECT grantee, privilege_type 
    FROM information_schema.role_table_grants 
    WHERE table_name = 'mv_hex_equity' AND grantee IN ('anon', 'authenticated');
  `);
  console.log('\nmv_hex_equity public grants:');
  console.table(mvGrants);
}

main();
