'use client';
import { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { getBotConfig, setSystemPrompt } from '@/lib/admin-store';

export function PromptTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { getBotConfig().then((c) => setPrompt(c.systemPrompt)).catch(() => {}); }, []);

  async function save() {
    setSaving(true);
    try { await setSystemPrompt(prompt, user?.name ?? 'Admin'); toast({ title: 'Prompt guardado', description: 'Aplica en el próximo mensaje.' }); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-3 pt-4">
      <p className="text-sm text-muted-foreground">Instrucciones del agente. Cambia su comportamiento de inmediato. Editá con cuidado.</p>
      <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={20} className="font-mono text-xs" />
      <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar prompt'}</Button>
    </div>
  );
}
