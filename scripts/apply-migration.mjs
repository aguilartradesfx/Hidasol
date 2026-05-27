#!/usr/bin/env node
// One-off helper to apply a single SQL migration file directly to Supabase
// Postgres and register it in supabase_migrations.schema_migrations.
//
// Usage:
//   node scripts/apply-migration.mjs <migration-file>
//
// Env vars required (loaded from .env.local):
//   SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD

import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import pkg from 'pg';

const { Client } = pkg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

// --- Load env from .env.local ---
const envPath = resolve(repoRoot, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, k, v] = m;
    if (!process.env[k]) process.env[k] = v.trim();
  }
}

const ref = process.env.SUPABASE_PROJECT_REF;
const pwd = process.env.SUPABASE_DB_PASSWORD;
if (!ref || !pwd || pwd.includes('PEGAR')) {
  console.error('Missing SUPABASE_PROJECT_REF or SUPABASE_DB_PASSWORD in .env.local');
  process.exit(1);
}

// --- Resolve migration file ---
const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/apply-migration.mjs <migration-file>');
  process.exit(1);
}
const sqlPath = resolve(repoRoot, arg);
if (!existsSync(sqlPath)) {
  console.error('Migration file not found:', sqlPath);
  process.exit(1);
}

const filename = basename(sqlPath);
const versionMatch = filename.match(/^(\d+)_?(.*?)\.sql$/);
if (!versionMatch) {
  console.error('Migration filename must start with a numeric version: YYYYMMDD_name.sql');
  process.exit(1);
}
const version = versionMatch[1];
const name = versionMatch[2] || '';

const sql = readFileSync(sqlPath, 'utf8');

// --- Connect via pooler (session mode at 5432 works for DDL) ---
const client = new Client({
  host: `aws-1-us-east-2.pooler.supabase.com`,
  port: 5432,
  user: `postgres.${ref}`,
  password: pwd,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

try {
  console.log(`→ Connecting to project ${ref}...`);
  await client.connect();

  // Check if already applied
  const existing = await client.query(
    `SELECT version FROM supabase_migrations.schema_migrations WHERE version = $1 LIMIT 1`,
    [version],
  );
  if (existing.rowCount > 0) {
    console.log(`! Version ${version} already in schema_migrations — skipping insert (will still re-run SQL? NO, aborting).`);
    console.log('  If you want to re-apply, manually remove the row first.');
    await client.end();
    process.exit(0);
  }

  console.log(`→ Applying ${filename} (version ${version})...`);
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      `INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
         VALUES ($1, $2, $3)`,
      [version, name, [sql]],
    );
    await client.query('COMMIT');
    console.log(`✓ Migration ${version} applied and registered.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
} catch (err) {
  console.error('✗ Failed:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
