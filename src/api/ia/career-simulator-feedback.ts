import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { SimulatorFeedbackRequest, SimulatorFeedbackResponse, SimulatorFeedbackDecision } from '../../app/core/models/career-simulator.models';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS Check: Validar el request desde el dominio de producción
  const allowedOrigin = process.env['ALLOWED_ORIGIN'];
  const origin = req.headers.origin || '';
  
  if (allowedOrigin && origin !== allowedOrigin) {
    return res.status(403).json({ error: 'CORS NO AUTORIZADO' });
  }

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Terminar peticiones pre-flight de inmediato
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta GEMINI_API_KEY en las variables de entorno' });
  }

  const body = req.body as SimulatorFeedbackRequest;

  // Validación básica
  if (!body || !body.career_slug || !body.user_decisions) {
    return res.status(400).json({ error: 'Payload incompleto o faltan datos clave (ej. career_slug)' });
  }

  const ai = new GoogleGenAI({ apiKey });

  // Construir el prompt de sistema dinámicamente
  let systemPrompt = `Eres un evaluador vocacional experto en metodología STEAM.
Tu objetivo NO es evaluar si las respuestas del usuario son "correctas" o "incorrectas", sino analizar su PATRÓN de razonamiento lógico, toma de decisiones y cómo esto se alinea con el área STEAM simulada (${body.steam_area} - Carrera: ${body.career_name}).
`;

  // Añadir la instrucción sobre respuestas demasiado rápidas si aplica
  if (body.avg_response_time_seconds < 4) {
    systemPrompt += `\nIMPORTANTE: El usuario ha respondido de forma sumamente rápida (promedio menor a 4 segundos por paso). Indica en el 'reasoning_style' que las respuestas parecen apresuradas o poco reflexivas.`;
  }

  systemPrompt += `\n\nDebes responder ÚNICAMENTE con un JSON válido que siga esta estructura:
{
  "reasoning_style": "string — descripción del estilo de razonamiento detectado",
  "steam_affinity_analysis": "string — análisis de afinidad con el área STEAM simulada",
  "strengths_detected": ["string"],
  "honest_reality_check": "string — algo real y honesto de esta carrera que el usuario debe saber",
  "affinity_score": number (de 0 a 100),
  "confidence_level": "high" | "medium" | "low",
  "suggested_next_simulators": ["slug_1", "slug_2"]
}`;

  try {
    // Manejo de timeout para Vercel Hobby Tier (Límite máximo de 10s)
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 8000);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: JSON.stringify(body),
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3, // Más creativo que el test, pero acotado a análisis
        responseMimeType: 'application/json',
        responseSchema: {
          type: "OBJECT",
          properties: {
            reasoning_style: { type: "STRING" },
            steam_affinity_analysis: { type: "STRING" },
            strengths_detected: { type: "ARRAY", items: { type: "STRING" } },
            honest_reality_check: { type: "STRING" },
            affinity_score: { type: "INTEGER" },
            confidence_level: { type: "STRING" },
            suggested_next_simulators: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: [
            "reasoning_style",
            "steam_affinity_analysis",
            "strengths_detected",
            "honest_reality_check",
            "affinity_score",
            "confidence_level",
            "suggested_next_simulators"
          ]
        }
      }
    });

    clearTimeout(timeoutId);

    const rawContent = response.text || '';
    
    // Purgar markdown hallucinations en caso de que Gemini devuelva tildes
    const cleanStr = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const parsedData: SimulatorFeedbackResponse = JSON.parse(cleanStr);

    // Regla de negocio: Si detectamos demasiada prisa en el frontend, invalidar nivel de confianza alto/medio
    if (body.bias_flags?.too_fast) {
      parsedData.confidence_level = 'low';
    }

    return res.status(200).json(parsedData);

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Timeout superado. El modelo tardó más de 8s en procesar.' });
    }
    console.error('[CareerSimulatorFeedback] Error en la generación:', error);
    return res.status(500).json({ error: 'Error interno del servidor procesando el feedback con la IA.' });
  }
}
