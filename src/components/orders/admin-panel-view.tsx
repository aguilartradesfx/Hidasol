'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { BotTab } from './admin/bot-tab';
import { PromptTab } from './admin/prompt-tab';
import { ConocimientoTab } from './admin/conocimiento-tab';
import { ProductosTab } from './admin/productos-tab';

export function AdminPanelView() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl lg:text-5xl font-bold font-['Bricolage_Grotesque'] text-foreground">
          Agente <span className="text-[#F97316]">IA</span>
        </h1>
        <p className="text-sm text-muted-foreground">Controlá el bot de WhatsApp: encendido, comportamiento, conocimiento y productos.</p>
      </div>
      <Tabs defaultValue="bot">
        <TabsList>
          <TabsTrigger value="bot">Bot</TabsTrigger>
          <TabsTrigger value="prompt">Comportamiento</TabsTrigger>
          <TabsTrigger value="conocimiento">Conocimiento</TabsTrigger>
          <TabsTrigger value="productos">Productos</TabsTrigger>
        </TabsList>
        <TabsContent value="bot"><BotTab /></TabsContent>
        <TabsContent value="prompt"><PromptTab /></TabsContent>
        <TabsContent value="conocimiento"><ConocimientoTab /></TabsContent>
        <TabsContent value="productos"><ProductosTab /></TabsContent>
      </Tabs>
    </div>
  );
}
