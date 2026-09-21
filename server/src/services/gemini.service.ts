import { env } from '../config/env.js';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

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

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
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

export async function generateJson<T>(prompt: string): Promise<T> {
  if (!env.geminiApiKey) {
    throw new AiServiceError('AI writing is not configured on the server', 'AI_NOT_CONFIGURED');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(`${GEMINI_URL}/${encodeURIComponent(env.geminiModel)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.geminiApiKey },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, responseMimeType: 'application/json' }
      })
    });
    const payload = await response.json().catch(() => ({})) as GeminiResponse;
    if (!response.ok) {
      throw new AiServiceError(payload.error?.message || 'The AI provider could not complete that request');
    }
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
    if (!text) throw new AiServiceError('The AI provider returned an empty response', 'AI_INVALID_RESPONSE');
    return parseJson<T>(text);
  } catch (error) {
    if (error instanceof AiServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AiServiceError('The AI provider took too long to respond');
    }
    throw new AiServiceError('Unable to reach the AI provider');
  } finally {
    clearTimeout(timeout);
  }
}
