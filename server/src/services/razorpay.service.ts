import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { BillingError } from './billing.shared.js';

type RazorpayClient = InstanceType<typeof Razorpay>;
let client: RazorpayClient | null = null;

function razorpayErrorMessage(error: unknown) {
  const err = error as { error?: { description?: string } | string; description?: string; message?: string };
  if (typeof err.error === 'string') return err.error;
  if (err.error && typeof err.error === 'object' && err.error.description) return err.error.description;
  return err.description || err.message || null;
}

export function getRazorpay() {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    throw new BillingError('Razorpay credentials are not configured', 503, 'RAZORPAY_NOT_CONFIGURED');
  }
  if (!client) {
    client = new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  }
  return client;
}

export async function createSubscription(planId: string, userId: string, customerEmail?: string | null) {
  const normalizedPlanId = planId.trim();
  if (!normalizedPlanId) throw new BillingError('Subscription plan is not linked to Razorpay', 400, 'PLAN_NOT_CONFIGURED');
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const payload = {
      plan_id: normalizedPlanId,
      total_count: 12,
      quantity: 1,
      notes: { user_id: userId },
      expire_by: nowSec + 30 * 24 * 60 * 60,
      customer_notify: customerEmail ? 1 : 0,
      ...(customerEmail ? { notify_info: { notify_email: customerEmail } } : {})
    };
    const subscription = await getRazorpay().subscriptions.create(payload as never) as { id: string; short_url: string; status: string };
    return { subscriptionId: subscription.id, shortUrl: subscription.short_url, status: subscription.status };
  } catch (error) {
    const message = razorpayErrorMessage(error) || 'Payment provider error';
    throw new BillingError(message, 502, 'PAYMENT_PROVIDER_ERROR');
  }
}

export async function cancelSubscription(subscriptionId: string) {
  await getRazorpay().subscriptions.cancel(subscriptionId);
}

export async function fetchSubscription(subscriptionId: string) {
  return getRazorpay().subscriptions.fetch(subscriptionId);
}

export async function fetchPlan(planId: string) {
  return getRazorpay().plans.fetch(planId);
}

export function verifyWebhookSignature(body: string, signature: string) {
  const secret = env.razorpay.webhookSecret;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}
