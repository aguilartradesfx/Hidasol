'use client';

/* WizardShell — contenedor a pantalla completa para crear una orden por pasos. */
import { X, ChevronLeft, ChevronRight, Save } from 'lucide-react';

interface WizardShellProps {
  title: string;
  stepTitles: string[];
  currentStep: number; // 0-based
  onClose: () => void;
  onBack: () => void;
  onNext: () => void; // avanza, o envía si es el último paso (lo decide el padre)
  onStepClick?: (index: number) => void;
  isLast: boolean;
  submitting?: boolean;
  nextDisabled?: boolean;
  error?: string | null;
  children: React.ReactNode;
}

export function WizardShell({
  title, stepTitles, currentStep, onClose, onBack, onNext, onStepClick,
  isLast, submitting, nextDisabled, error, children,
}: WizardShellProps) {
  const total = stepTitles.length;
  const pct = Math.round(((currentStep + 1) / total) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-background/95 backdrop-blur px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-bold font-['Bricolage_Grotesque']">{title}</h2>
            <button type="button" onClick={onClose} title="Cancelar"
              className="p-2 rounded-[10px] border border-border hover:bg-muted transition-smooth">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Barra de progreso */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="font-medium text-foreground">
                Paso {currentStep + 1} de {total} · <span className="text-primary">{stepTitles[currentStep]}</span>
              </span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
            {/* Pills de pasos (clickeables) */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {stepTitles.map((t, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                return (
                  <button key={t} type="button" onClick={() => onStepClick?.(i)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-smooth ${
                      active ? 'bg-primary text-primary-foreground border-primary'
                        : done ? 'bg-primary/10 text-primary border-primary/30'
                        : 'bg-muted/40 text-muted-foreground border-border hover:border-foreground/30'
                    }`}>
                    {i + 1}. {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido del paso */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        <div className="max-w-3xl mx-auto">
          {children}
          {error && (
            <div className="mt-4 p-4 rounded-[10px] bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium">
              ❌ {error}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button type="button" onClick={onBack} disabled={currentStep === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-[10px] border border-border font-medium transition-smooth hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" /> Atrás
          </button>
          <button type="button" onClick={onNext} disabled={submitting || nextDisabled}
            className="flex items-center gap-2 px-6 py-3 rounded-[10px] bg-primary text-primary-foreground font-medium transition-smooth hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
            {isLast ? (
              <><Save className="w-4 h-4" /> {submitting ? 'Creando...' : 'Crear orden'}</>
            ) : (
              <>Siguiente <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
