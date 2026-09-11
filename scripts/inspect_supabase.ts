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

  const relations = await query(`
    SELECT
      c.relname as name,
      CASE c.relkind
        WHEN 'r' THEN 'table'
        WHEN 'v' THEN 'view'
        WHEN 'm' THEN 'materialized_view'
      END as type,
      pg_catalog.pg_get_userbyid(c.relowner) as owner,
      c.relrowsecurity as rls_enabled,
      c.reloptions
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'v', 'm')
    ORDER BY c.relname;
  `);
  console.log('\nPublic Schema Relations:');
  console.table(relations);

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

  const postgisExt = await query(`
    SELECT extname, extowner::regrole, n.nspname as schema
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE extname = 'postgis';
  `);
  console.log('\nPostGIS Extension Status:');
  console.table(postgisExt);

  const geoTest = await query(`
    SELECT
      a.call_sign,
      i.primary_need,
      ROUND(ST_Distance(a.location::geography, i.location::geography)::numeric, 2) as distance_meters
    FROM assets a, incidents i
    LIMIT 1;
  `);
  console.log('\nLive Geospatial Distance Calculation:');
  console.table(geoTest);
}

main();
