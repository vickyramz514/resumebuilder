import 'dotenv/config';

function envFlag(value: string | undefined, defaultValue: boolean) {
  if (value == null || value.trim() === '') return defaultValue;
  return !['0', 'false', 'off', 'no', 'disabled', 'disable'].includes(value.trim().toLowerCase());
}

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
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite',
  publicApiUrl: (process.env.PUBLIC_API_URL ?? process.env.CLIENT_URL ?? 'http://localhost:5173').replace(/\/$/, ''),
  supportEmail: process.env.SUPPORT_EMAIL ?? 'support@datacaptain.in',
  razorpay: (() => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const raw = process.env.RAZORPAY_MODE?.toLowerCase()?.trim();
    const declaredMode = raw === 'test' || raw === 'live' ? raw : null;
    const mode = keyId?.startsWith('rzp_live_') ? 'live' : keyId?.startsWith('rzp_test_') ? 'test' : null;
    return {
      keyId,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
      mode,
      declaredMode,
      starterPlanId: process.env.RAZORPAY_PLAN_STARTER ?? 'plan_TfKovTk3qxjBhH',
      proPlanId: process.env.RAZORPAY_PLAN_PRO ?? 'plan_TfjVh8pptWF8AG',
      // Flip RAZORPAY_PLAN_PRO_ENABLED to false/disable/0 to hide this plan without deleting it.
      proPlanEnabled: envFlag(process.env.RAZORPAY_PLAN_PRO_ENABLED, true)
    };
  })()
};

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production');
}
