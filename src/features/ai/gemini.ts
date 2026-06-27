const API_KEY  = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

export async function generarMensajeSOS(params: {
  problema:     string;
  vehiculo?:    string | null;
  tallerNombre: string;
  distanciaKm?: number | null;
}): Promise<string> {
  const { problema, vehiculo, tallerNombre, distanciaKm } = params;

  const distanciaTexto =
    distanciaKm == null ? '' :
    distanciaKm < 1    ? ` Me encuentro a ${Math.round(distanciaKm * 1000)} metros de su taller.` :
                         ` Me encuentro a ${distanciaKm.toFixed(1)} km de su taller.`;

  const vehiculoTexto = vehiculo && vehiculo !== 'No especificado'
    ? `- Vehículo: ${vehiculo}\n`
    : '';

  const prompt = `Redacta un mensaje de WhatsApp de emergencia para un taller mecánico en Bolivia. Responde SOLO con el mensaje, texto plano, sin asteriscos ni comillas.

El mensaje debe seguir exactamente este formato:
"Buenas, me comunico a través de la app El Maestrito. Estoy varado y necesito asistencia urgente en [taller]. [Descripción técnica del problema en 2 oraciones]. [Distancia si hay]. ¿Tienen disponibilidad para asistirme de inmediato?"

Datos:
- Taller: ${tallerNombre}
- Problema del conductor: ${problema}
${vehiculoTexto}${distanciaTexto ? `- Distancia: ${distanciaTexto}\n` : ''}
Traduce el problema a lenguaje técnico automotriz. Completa el mensaje entero sin cortarlo.`;

  const res = await fetch(ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      contents:         [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature:   0.7,
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const json = await res.json();
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p: { text?: string }) => p.text ?? '').join('').trim();
}
