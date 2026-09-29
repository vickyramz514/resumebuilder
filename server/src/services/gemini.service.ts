import { env } from '../config/env.js';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const FALLBACK_MODELS = ['gemini-2.5-flash'];

export class AiServiceError extends Error {
  constructor(
    message: string,
    public readonly code: 'AI_NOT_CONFIGURED' | 'AI_PROVIDER_ERROR' | 'AI_INVALID_RESPONSE' = 'AI_PROVIDER_ERROR',
    public readonly statusCode = 503
  ) {
    super(message);
    this.name = 'AiServiceError';
  }
}

export type GeminiSchema = Record<string, unknown>;

type GeminiPart = { text?: string; thought?: boolean };
type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: GeminiPart[] };
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
};

function parseJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        // Fall through to a useful provider error.
      }
    }
    throw new AiServiceError('The AI provider returned an unreadable response', 'AI_INVALID_RESPONSE');
  }
}

function answerText(payload: GeminiResponse) {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  const visible = parts.filter((part) => !part.thought && part.text).map((part) => part.text).join('').trim();
  if (visible) return visible;
  return parts.map((part) => part.text ?? '').join('').trim();
}

function modelsToTry() {
  const primary = env.geminiModel.trim();
  return [primary, ...FALLBACK_MODELS.filter((model) => model !== primary)];
}

function generationConfig(model: string, schema?: GeminiSchema) {
  const config: Record<string, unknown> = {};
  if (schema) {
    config.responseMimeType = 'application/json';
    config.responseSchema = schema;
  }
  if (model.startsWith('gemini-3')) config.thinkingConfig = { thinkingLevel: 'minimal' };
  return config;
}

async function callModel<T>(model: string, prompt: string, schema: GeminiSchema | undefined, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${GEMINI_URL}/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.geminiApiKey! },
    signal,
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: generationConfig(model, schema)
    })
  });
  const payload = await response.json().catch(() => ({})) as GeminiResponse;
  if (!response.ok) {
    if (response.status === 402) {
      throw new AiServiceError(
        'Gemini has no remaining credits. Add prepaid credit in Google AI Studio, then try again.',
        'AI_PROVIDER_ERROR',
        402
      );
    }
    const providerMessage = payload.error?.message || 'The AI provider could not complete that request';
    throw new AiServiceError(providerMessage, 'AI_PROVIDER_ERROR', response.status);
  }
  const text = answerText(payload);
  if (!text) {
    const reason = payload.candidates?.[0]?.finishReason || payload.promptFeedback?.blockReason || 'empty';
    throw new AiServiceError(`The AI provider returned an empty response (${reason})`, 'AI_INVALID_RESPONSE', 502);
  }
  return parseJson<T>(text);
}

function canTryNext(error: unknown) {
  if (!(error instanceof AiServiceError)) return true;
  return error.statusCode === 400 || error.statusCode === 404 || error.statusCode === 429 || error.statusCode === 500 || error.statusCode === 503;
}

export async function generateJson<T>(prompt: string, schema?: GeminiSchema): Promise<T> {
  if (!env.geminiApiKey || env.geminiApiKey === 'YOUR_GEMINI_API_KEY') {
    throw new AiServiceError('AI writing is not configured. Add GEMINI_API_KEY on the API host, then redeploy.', 'AI_NOT_CONFIGURED');
  }

  let lastError: unknown;
  for (const model of modelsToTry()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    try {
      return await callModel<T>(model, prompt, schema, controller.signal);
    } catch (error) {
      lastError = error;
      if (error instanceof AiServiceError && error.statusCode === 402) throw error;
      if (!canTryNext(error)) throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastError instanceof AiServiceError) {
    const status = lastError.statusCode === 429 || lastError.statusCode === 503 ? 503 : 502;
    throw new AiServiceError(lastError.message, lastError.code, status);
  }
  if (lastError instanceof Error && lastError.name === 'AbortError') {
    throw new AiServiceError('The AI provider took too long to respond');
  }
  throw new AiServiceError('Unable to reach the AI provider');
}
