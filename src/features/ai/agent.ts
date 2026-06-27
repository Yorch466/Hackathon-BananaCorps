import { buscarRepuesto, buscarTallerPorEspecialidad, consultarStockProveedor } from './agentTools';
import type { Message, MessageAction } from './types';

const DEFAULT_LAT = -17.3895;
const DEFAULT_LNG = -66.1568;

// ─── Detección de intención ───────────────────────────────────────────────────

const TALLER_WORDS = ['taller', 'mecánico', 'mecanico', 'arreglar', 'reparar',
  'especialidad', 'servicio', 'revision', 'revisión', 'motor',
  'electricidad', 'suspensión', 'suspension', 'transmisión', 'transmision'];

const PROVEEDOR_WORDS = ['proveedor', 'autopartista', 'tienda', 'local',
  'tiene este', 'tienen', 'stock de'];

const STOP_WORDS = new Set([
  'donde', 'consigo', 'hay', 'tiene', 'quiero', 'necesito', 'busco', 'cerca',
  'mio', 'mi', 'que', 'como', 'cual', 'para', 'con', 'sin', 'un', 'una',
  'unos', 'unas', 'el', 'la', 'los', 'las', 'de', 'del', 'en', 'por',
  'puedo', 'puedes', 'tienen', 'disponible', 'disponibles', 'repuesto',
  'repuestos', 'taller', 'talleres', 'me', 'mas', 'más', 'algún', 'algun',
  'alguna', 'mío', 'cuanto', 'cuánto', 'ver', 'dame', 'mostrar', 'muestrame',
  'quisiera', 'saber', 'sobre',
]);

type Intent = 'repuesto' | 'taller' | 'stock_proveedor';

export interface AgentResponse {
  text:    string;
  actions: MessageAction[];
}

function detectIntent(text: string): Intent {
  const lower = text.toLowerCase();
  if (PROVEEDOR_WORDS.some((w) => lower.includes(w))) return 'stock_proveedor';
  if (TALLER_WORDS.some((w) => lower.includes(w))) return 'taller';
  return 'repuesto';
}

function extractKeyword(text: string): string {
  const cleaned = text
    .toLowerCase()
    .replace(/[¿?¡!,]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
    .slice(0, 3)
    .join(' ')
    .trim();
  return cleaned || text.trim();
}

// ─── Formateadores ────────────────────────────────────────────────────────────

function formatRepuestos(data: any[], keyword: string): AgentResponse {
  if (!data.length) {
    return {
      text: `No encontré "${keyword}" en stock en ninguna tienda registrada en ANFIAUTO.\n\nRevisá más opciones en la pestaña Productos 🔍`,
      actions: [],
    };
  }

  const slice = data.slice(0, 4);
  const lines = [`Encontré ${slice.length} resultado${slice.length > 1 ? 's' : ''} para "${keyword}":\n`];

  slice.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.producto}`);
    lines.push(`   🏪 ${r.nombreProveedor}`);
    lines.push(`   📍 ${r.direccion}`);
    if (r.telefono) lines.push(`   📞 ${r.telefono}`);
    lines.push(`   💰 ${r.precio}   📦 ${r.cantidad} unid.`);
    lines.push(`   📏 ${r.distanciaKm} km`);
    if (i < slice.length - 1) lines.push('');
  });

  const seen = new Set<string>();
  const actions: MessageAction[] = slice
    .filter((r) => r.idProveedor && !seen.has(String(r.idProveedor)) && seen.add(String(r.idProveedor)))
    .map((r) => ({ label: r.nombreProveedor, id: String(r.idProveedor), type: 'proveedor' as const }));

  return { text: lines.join('\n'), actions };
}

function formatTalleres(data: any[], keyword: string): AgentResponse {
  if (!data.length) {
    return {
      text: `No encontré talleres con "${keyword}" en ANFIAUTO.\n\nRevisá todos los talleres en la pestaña Mapa 🗺️`,
      actions: [],
    };
  }

  const slice = data.slice(0, 4);
  const lines = [`Encontré ${slice.length} taller${slice.length > 1 ? 'es' : ''} con "${keyword}":\n`];

  slice.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.nombreTaller}`);
    lines.push(`   📍 ${r.direccion}`);
    lines.push(`   📞 ${r.telefono}`);
    lines.push(`   📏 ${r.distanciaKm} km`);
    if (i < slice.length - 1) lines.push('');
  });

  const actions: MessageAction[] = slice
    .filter((r) => r.idTaller)
    .map((r) => ({ label: r.nombreTaller, id: String(r.idTaller), type: 'taller' as const }));

  return { text: lines.join('\n'), actions };
}

function formatStockProveedor(data: any[], keyword: string): AgentResponse {
  if (!data.length) {
    return { text: `No encontré stock del proveedor "${keyword}" en ANFIAUTO.`, actions: [] };
  }

  const lines = [`Stock de "${keyword}" (${data.length} producto${data.length > 1 ? 's' : ''}):\n`];
  data.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.producto}`);
    lines.push(`   💰 ${r.precio}   📦 ${r.cantidad} unid.`);
  });

  return { text: lines.join('\n'), actions: [] };
}

// ─── Punto de entrada ─────────────────────────────────────────────────────────

export async function sendMessage(
  userMessage: string,
  location: { latitude: number; longitude: number } | null,
  _chatHistory: Message[],
): Promise<AgentResponse> {
  const lat     = location?.latitude  ?? DEFAULT_LAT;
  const lng     = location?.longitude ?? DEFAULT_LNG;
  const intent  = detectIntent(userMessage);
  const keyword = extractKeyword(userMessage);

  try {
    if (intent === 'taller') {
      return formatTalleres(await buscarTallerPorEspecialidad(keyword, lat, lng), keyword);
    }
    if (intent === 'stock_proveedor') {
      return formatStockProveedor(await consultarStockProveedor(keyword), keyword);
    }
    return formatRepuestos(await buscarRepuesto(keyword, lat, lng), keyword);
  } catch (e) {
    console.error('[Agent]', e);
    return { text: 'No pude consultar en este momento. Verificá tu conexión e intentá de nuevo.', actions: [] };
  }
}
