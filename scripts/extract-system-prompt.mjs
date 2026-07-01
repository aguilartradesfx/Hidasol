import fs from 'node:fs';

const d = JSON.parse(fs.readFileSync('Hidasol - Agent Unificado v2.json', 'utf8'));
const node = d.nodes.find((n) => n.name === 'AI Agent Unificado');
let sp = node.parameters.options.systemMessage || '';
if (sp.startsWith('=')) sp = sp.slice(1); // n8n expression prefix
fs.writeFileSync('scripts/system-prompt.txt', sp);
console.log('Extraídos', sp.length, 'chars a scripts/system-prompt.txt');
