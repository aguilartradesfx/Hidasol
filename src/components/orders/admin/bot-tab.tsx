'use client';
import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { getBotConfig, setBotEnabled } from '@/lib/admin-store';

export function BotTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const by = user?.name ?? 'Admin';

  useEffect(() => {
    getBotConfig().then((c) => setEnabled(c.botEnabled)).catch(() => {});
  }, []);

  async function toggleGlobal(v: boolean) {
    setEnabled(v);
    try { await setBotEnabled(v, by); toast({ title: v ? 'Bot encendido' : 'Bot apagado' }); }
    catch (e: any) { setEnabled(!v); toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="rounded-[12px] border border-border bg-card p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold">Bot de WhatsApp</p>
          <p className="text-sm text-muted-foreground">Cuando está apagado, el bot no responde a nadie.</p>
        </div>
        <Switch checked={enabled} onCheckedChange={toggleGlobal} />
      </div>
      <p className="text-xs text-muted-foreground">
        Para que un humano tome un chat puntual, desde WhatsApp/GHL agregá el tag <span className="font-mono">bot_desactivado</span> a ese contacto.
      </p>
    </div>
  );
}
