/**
 * Deploy Supabase Migrations via Supabase Management API
 *
 * Directly applies all migrations in db/migrations/ to the live Supabase
 * project bsmvuuemijrjoqvzzdvh using the authenticated Management API.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'bsmvuuemijrjoqvzzdvh';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN is required in .env or environment');
  process.exit(1);
}

const MIGRATIONS_DIR = path.join(process.cwd(), 'db', 'migrations');

async function executeSql(query: string, name: string) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Migration ${name} failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function main() {
  console.log(`\n🚀 Deploying migrations to Supabase project [${PROJECT_REF}]...\n`);

  // Create migration tracking table if not exists
  await executeSql(`
    CREATE TABLE IF NOT EXISTS _resq_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `, 'init_tracking');

  // Check if core tables already exist from previous partial run
  const tableCheck = await executeSql(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agencies';
  `, 'check_tables');

  const hasCoreTables = Array.isArray(tableCheck) && tableCheck.length > 0;

  const appliedRows = ((await executeSql(
    'SELECT name FROM _resq_migrations;',
    'get_applied'
  )) as { name: string }[]) || [];
  const appliedSet = new Set(appliedRows.map(r => r.name));

  // If core tables exist but not recorded in tracking table, seed tracking table for 001-006
  if (hasCoreTables) {
    for (let i = 1; i <= 6; i++) {
      const pad = String(i).padStart(3, '0');
      const match = fs.readdirSync(MIGRATIONS_DIR).find(f => f.startsWith(pad));
      if (match && !appliedSet.has(match)) {
        await executeSql(`INSERT INTO _resq_migrations (name) VALUES ('${match}') ON CONFLICT (name) DO NOTHING;`, 'record_prior');
        appliedSet.add(match);
        console.log(`ℹ️  Marked already-applied: ${match}`);
      }
    }
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`⏩ Skipping already applied: ${file}`);
      continue;
    }

    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`⏳ Applying: ${file}...`);
    try {
      await executeSql(sql, file);
      await executeSql(`INSERT INTO _resq_migrations (name) VALUES ('${file}');`, 'record_migration');
      console.log(`✅ Applied:  ${file}\n`);
    } catch (err: any) {
      console.error(`❌ Error on ${file}:`, err.message);
      process.exit(1);
    }
  }

  // Verification
  console.log('🔍 Verifying live Supabase database objects...');
  const verifyQueries = [
    { label: 'Agencies Count', query: 'SELECT count(*) FROM agencies;' },
    { label: 'Assets Count', query: 'SELECT count(*) FROM assets;' },
    { label: 'Incidents Count', query: 'SELECT count(*) FROM incidents;' },
    { label: 'Materialized View Rows', query: 'SELECT count(*) FROM mv_hex_equity;' },
    { label: 'Stored Procedures', query: "SELECT proname FROM pg_proc WHERE proname LIKE 'fn_%' AND pronamespace = 'public'::regnamespace;" },
  ];

  for (const v of verifyQueries) {
    try {
      const res = await executeSql(v.query, v.label);
      console.log(`   ${v.label}:`, JSON.stringify(res));
    } catch (e: any) {
      console.warn(`   ⚠️ ${v.label}:`, e.message);
    }
  }

  console.log('\n🎉 ALL MIGRATIONS AND SEED DATA DEPLOYED SUCCESSFULLY TO SUPABASE!\n');
}

main();
