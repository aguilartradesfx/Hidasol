const BASE = 'https://services.leadconnectorhq.com';

function headers() {
  return {
    Authorization: `Bearer ${process.env.GHL_TOKEN}`,
    Version: '2021-07-28',
    'Content-Type': 'application/json',
  };
}

export async function getContact(contactId: string): Promise<{ tags: string[]; name: string | null; phone: string | null; email: string | null }> {
  try {
    const res = await fetch(`${BASE}/contacts/${contactId}`, { headers: headers() });
    if (!res.ok) return { tags: [], name: null, phone: null, email: null };
    const j: any = await res.json();
    const c = j.contact ?? j;
    return {
      tags: Array.isArray(c.tags) ? c.tags.map(String) : [],
      name: c.firstName ?? c.name ?? null,
      phone: c.phone ?? null,
      email: c.email ?? null,
    };
  } catch {
    return { tags: [], name: null, phone: null, email: null };
  }
}
