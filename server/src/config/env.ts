import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT ?? 3001),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? process.env.CLIENT_URL ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET ?? 'development-only-change-me',
  databaseUrl: process.env.DATABASE_URL,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
};

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production');
}
