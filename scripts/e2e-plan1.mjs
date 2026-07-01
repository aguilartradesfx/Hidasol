// scripts/e2e-plan1.mjs — requiere WA_WEBHOOK_SECRET, PROCESS_SECRET, APP_URL en env
const APP = process.env.APP_URL;
const cid = 'E2E_' + Math.floor(Math.random() * 1e6);
// 1) simular 2 mensajes entrantes
for (const m of ['Hola', 'quiero una lona']) {
  const r = await fetch(`${APP}/api/wa/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-wa-secret': process.env.WA_WEBHOOK_SECRET }, body: JSON.stringify({ customData: { contact_id: cid, message: m, channel: 'Whatsapp' } }) });
  console.log('webhook', m, r.status, await r.text());
}
// 2) forzar el proceso (simulando el cron)
const p = await fetch(`${APP}/api/wa/process`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-process-secret': process.env.PROCESS_SECRET }, body: JSON.stringify({ contact_id: cid }) });
console.log('process', p.status, await p.text()); // espera { claimed: 2 }
