const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function loadRazorpayCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Razorpay Checkout failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay Checkout'));
    document.body.appendChild(script);
  });
}

export async function openRazorpaySubscriptionCheckout(params: {
  key: string;
  subscriptionId: string;
  name: string;
  description: string;
  callbackUrl: string;
}) {
  await loadRazorpayCheckoutScript();
  const Ctor = window.Razorpay;
  if (!Ctor) throw new Error('Razorpay Checkout is not available');
  new Ctor({
    key: params.key,
    subscription_id: params.subscriptionId,
    name: params.name,
    description: params.description,
    callback_url: params.callbackUrl,
    theme: { color: '#255c4b' }
  }).open();
}

export function razorpayCallbackUrl() {
  const configured = (import.meta.env.API_URL ?? import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '');
  const origin = configured
    ? `${configured.startsWith('http') ? '' : 'https://'}${configured}`
    : window.location.origin;
  return `${origin}/api/payment/razorpay-callback`;
}
