'use client';
import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { getBotConfig, setBotEnabled, listContactStates, setContactBot } from '@/lib/admin-store';

export function BotTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const by = user?.name ?? 'Admin';

  useEffect(() => {
    getBotConfig().then((c) => setEnabled(c.botEnabled)).catch(() => {});
    listContactStates().then(setContacts).catch(() => {});
  }, []);

  async function toggleGlobal(v: boolean) {
    setEnabled(v);
    try { await setBotEnabled(v, by); toast({ title: v ? 'Bot encendido' : 'Bot apagado' }); }
    catch (e: any) { setEnabled(!v); toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  }
  async function toggleContact(cid: string, v: boolean) {
    const previous = contacts.find((c) => c.contact_id === cid)?.estado_bot ?? 'off';
    setContacts((cs) => cs.map((c) => c.contact_id === cid ? { ...c, estado_bot: v ? 'idle' : 'off' } : c));
    try { await setContactBot(cid, v); }
    catch (e: any) {
      setContacts((cs) => cs.map((c) => c.contact_id === cid ? { ...c, estado_bot: previous } : c));
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="rounded-[12px] border border-border bg-card p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold">Bot global</p>
          <p className="text-sm text-muted-foreground">Cuando está apagado, el bot no responde a nadie.</p>
        </div>
        <Switch checked={enabled} onCheckedChange={toggleGlobal} />
      </div>
      <div className="rounded-[12px] border border-border bg-card p-4">
        <p className="font-semibold mb-3">Por contacto (apagar para que un humano tome el chat)</p>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {contacts.map((c) => (
            <div key={c.contact_id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
              <span className="text-sm truncate">{c.name || c.contact_id}</span>
              <Switch checked={c.estado_bot !== 'off'} onCheckedChange={(v) => toggleContact(c.contact_id, v)} />
            </div>
          ))}
          {contacts.length === 0 && <p className="text-sm text-muted-foreground">Sin conversaciones aún.</p>}
        </div>
      </div>
    </div>
  );
}
