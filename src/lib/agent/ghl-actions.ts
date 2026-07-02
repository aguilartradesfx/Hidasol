const BASE = 'https://services.leadconnectorhq.com';

function headers() {
  return {
    Authorization: `Bearer ${process.env.GHL_TOKEN}`,
    Version: '2021-07-28',
    'Content-Type': 'application/json',
  };
}

export async function sendMessage(contactId: string, message: string): Promise<void> {
  const res = await fetch(`${BASE}/conversations/messages`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ type: 'WhatsApp', contactId, message }),
  });
  if (!res.ok) throw new Error(`GHL sendMessage ${res.status}: ${await res.text()}`);
}

export async function addTag(contactId: string, tag: string): Promise<void> {
  const res = await fetch(`${BASE}/contacts/${contactId}/tags`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ tags: [tag] }),
  });
  if (!res.ok) throw new Error(`GHL addTag ${res.status}: ${await res.text()}`);
}
