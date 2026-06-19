// Aplica la migración de la columna `elementos jsonb` vía la Management API de
// Supabase. Lee credenciales de .env.local. No imprime secretos.
import { readFileSync } from 'node:fs';

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return env;
}

const env = loadEnv(new URL('../.env.local', import.meta.url));
const ref = env.SUPABASE_PROJECT_REF;
const token = env.SUPABASE_ACCESS_TOKEN;

if (!ref || !token) {
  console.error('Faltan SUPABASE_PROJECT_REF o SUPABASE_ACCESS_TOKEN en .env.local');
  process.exit(1);
}

const query = 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS elementos jsonb;';

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
});

const text = await res.text();
if (!res.ok) {
  console.error('ERROR', res.status, text);
  process.exit(1);
}
console.log('OK — migración aplicada. Respuesta:', text || '(vacía)');

// Verifica que la columna exista.
const verify = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='orders' AND column_name='elementos';",
  }),
});
console.log('Verificación columna:', await verify.text());
