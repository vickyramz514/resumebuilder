import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AiServiceError } from '../services/gemini.service.js';

export function errorMiddleware(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(error);
  if (error instanceof ZodError) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.issues.map((issue) => issue.message).join(', ') } });
  }
  if (error instanceof AiServiceError) {
    return res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
  }
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}
