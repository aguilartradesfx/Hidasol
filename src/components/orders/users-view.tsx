'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Check, ShieldCheck, Palette, Factory } from 'lucide-react';
import { USER_CREDENTIALS } from '@/contexts/auth-context';
import { useToast } from '@/components/ui/use-toast';

type Group = {
  id: string;
  title: string;
  icon: any;
  description: string;
  match: (username: string) => boolean;
};

const GROUPS: Group[] = [
  {
    id: 'admin',
    title: 'Administración',
    icon: ShieldCheck,
    description: 'Acceso global a todas las órdenes, estaciones y reportes.',
    match: (u) => u === 'admin' || u === 'ventas',
  },
  {
    id: 'diseno',
    title: 'Diseño',
    icon: Palette,
    description: 'Cada diseñador ve solo las órdenes que le fueron asignadas.',
    match: (u) => u.startsWith('arte'),
  },
  {
    id: 'estaciones',
    title: 'Estaciones de producción',
    icon: Factory,
    description: 'Cada usuario ve solo las órdenes que están actualmente en su estación.',
    match: (u) =>
      ['corte', 'laser', 'litografia', 'taller', 'encuadernacion', 'acabados', 'bodega'].includes(u),
  },
];

export function UsersView() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const toggleReveal = (username: string) => {
    setRevealed((prev) => ({ ...prev, [username]: !prev[username] }));
  };

  const handleCopy = async (username: string, password: string) => {
    const text = `${username}\n${password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(username);
      toast({
        title: '📋 Credenciales copiadas',
        description: `Usuario ${username} listo para pegar.`,
      });
      setTimeout(() => setCopied((cur) => (cur === username ? null : cur)), 1500);
    } catch {
      toast({
        title: '❌ No se pudo copiar',
        description: 'Tu navegador bloqueó el acceso al portapapeles.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl lg:text-5xl font-bold font-['Bricolage_Grotesque'] text-foreground mb-1 lg:mb-2">
          Usua<span className="text-[#F97316]">rios</span>
        </h1>
        <p className="text-sm lg:text-lg text-muted-foreground">
          Credenciales de acceso al sistema. Solo visible para administradores.
        </p>
      </div>

      {/* Security note */}
      <div className="rounded-[12px] border border-[#F97316]/30 bg-[#F97316]/5 p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" />
        <div className="text-sm space-y-1">
          <p className="font-semibold text-foreground">Información sensible</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Estas credenciales dan acceso al sistema. Usá el botón "Copiar" para enviarlas por un canal
            privado (no las pegues en chats grupales ni capturas de pantalla compartidas).
          </p>
        </div>
      </div>

      {/* Groups */}
      {GROUPS.map((group) => {
        const Icon = group.icon;
        const members = USER_CREDENTIALS.filter((c) => group.match(c.username));
        if (members.length === 0) return null;

        return (
          <section key={group.id} className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-[10px] bg-primary/10 shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-['Bricolage_Grotesque'] text-foreground leading-tight">
                  {group.title}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
              </div>
              <span className="ml-auto text-xs text-muted-foreground font-mono">
                {members.length} {members.length === 1 ? 'usuario' : 'usuarios'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {members.map((c) => {
                const isRevealed = !!revealed[c.username];
                const isCopied = copied === c.username;

                return (
                  <div
                    key={c.username}
                    className="rounded-[12px] border border-border bg-card p-4 space-y-3"
                  >
                    {/* Top: name + role */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                          {c.role}
                        </p>
                        <p className="font-mono text-base font-bold text-foreground mt-0.5 break-all">
                          {c.username}
                        </p>
                      </div>
                    </div>

                    {/* Password row */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0 px-3 py-2 rounded-[8px] bg-secondary border border-border font-mono text-sm break-all">
                        {isRevealed ? (
                          <span className="text-foreground">{c.password}</span>
                        ) : (
                          <span className="text-muted-foreground tracking-[0.2em]" aria-label="Contraseña oculta">
                            ••••••••••••••
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleReveal(c.username)}
                        className="p-2 rounded-[8px] bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all duration-200"
                        title={isRevealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        aria-label={isRevealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Copy button */}
                    <button
                      onClick={() => handleCopy(c.username, c.password)}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-[8px] text-sm font-semibold transition-all duration-200 ${
                        isCopied
                          ? 'bg-[#34D399] text-[#065F46]'
                          : 'bg-[#F97316] text-white hover:bg-[#EA580C]'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar credenciales
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
