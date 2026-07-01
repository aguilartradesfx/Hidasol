export interface NormalizedMessage {
  contactId: string;
  text: string;
  type: 'text' | 'audio' | 'image';
  mediaUrl: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  channel: string;
}
export interface BotConfig {
  botEnabled: boolean;
  systemPrompt: string;
  model: string;
  temperature: number;
}
export interface GateInput {
  globalEnabled: boolean;
  tags: string[];
  estadoBot: string | null;
}
