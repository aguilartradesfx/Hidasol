'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { listProductos, upsertProducto, deleteProducto } from '@/lib/admin-store';

export function ProductosTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const reload = () => listProductos().then(setItems).catch(() => {});
  useEffect(() => { reload(); }, []);

  async function save() {
    try { await upsertProducto(edit); setOpen(false); reload(); toast({ title: 'Producto guardado' }); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  }
  async function remove(id: string) {
    if (!confirm('¿Eliminar este producto?')) return;
    try { await deleteProducto(id); reload(); } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  }

  return (
    <div className="space-y-3 pt-4">
      <Button size="sm" onClick={() => { setEdit({ producto: '', categoria: '', activo: true }); setOpen(true); }}>+ Producto</Button>
      <div className="rounded-[12px] border border-border bg-card divide-y divide-border/50">
        {items.map((p) => (
          <div key={p.id} className="flex items-center justify-between p-3">
            <div className="min-w-0"><p className="font-medium truncate">{p.producto}</p><p className="text-xs text-muted-foreground">{p.categoria} {p.activo ? '' : '· inactivo'}</p></div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => { setEdit(p); setOpen(true); }}>Editar</Button>
              <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>Eliminar</Button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground p-3">Sin productos.</p>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? 'Editar' : 'Nuevo'} producto</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <Input placeholder="Nombre" value={edit.producto ?? ''} onChange={(e) => setEdit({ ...edit, producto: e.target.value })} />
              <Input placeholder="Categoría" value={edit.categoria ?? ''} onChange={(e) => setEdit({ ...edit, categoria: e.target.value })} />
              <div className="flex items-center gap-2"><Switch checked={!!edit.activo} onCheckedChange={(v) => setEdit({ ...edit, activo: v })} /><span className="text-sm">Activo</span></div>
              <Button onClick={save}>Guardar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
