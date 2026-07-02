'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { listKnowledge } from '@/lib/admin-store';

export function ConocimientoTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const reload = () => listKnowledge().then(setItems).catch(() => {});
  useEffect(() => { reload(); }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/knowledge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(edit) });
      if (!res.ok) throw new Error((await res.json()).error || 'error');
      setOpen(false); reload(); toast({ title: 'Conocimiento guardado', description: 'Re-indexado (embedding) OK.' });
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  }
  async function remove(id: string) {
    if (!confirm('¿Eliminar este conocimiento?')) return;
    try { const res = await fetch('/api/admin/knowledge', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) }); if (!res.ok) throw new Error('error'); reload(); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  }

  return (
    <div className="space-y-3 pt-4">
      <p className="text-sm text-muted-foreground">Información que el bot usa para responder (ubicación, políticas, etc.). Al guardar, se re-indexa automáticamente.</p>
      <Button size="sm" onClick={() => { setEdit({ contenido: '', categoria: '' }); setOpen(true); }}>+ Conocimiento</Button>
      <div className="rounded-[12px] border border-border bg-card divide-y divide-border/50">
        {items.map((k) => (
          <div key={k.id} className="flex items-start justify-between p-3 gap-3">
            <div className="min-w-0"><p className="text-sm truncate">{k.contenido}</p><p className="text-xs text-muted-foreground">{k.categoria}</p></div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => { setEdit(k); setOpen(true); }}>Editar</Button>
              <Button size="sm" variant="destructive" onClick={() => remove(k.id)}>Eliminar</Button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground p-3">Sin conocimiento.</p>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? 'Editar' : 'Nuevo'} conocimiento</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <Input placeholder="Categoría (ej: ubicacion)" value={edit.categoria ?? ''} onChange={(e) => setEdit({ ...edit, categoria: e.target.value })} />
              <Textarea placeholder="Contenido" rows={6} value={edit.contenido ?? ''} onChange={(e) => setEdit({ ...edit, contenido: e.target.value })} />
              <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
