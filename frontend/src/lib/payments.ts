import { apiFetch } from './api';

// TypeScript doesn't know about the global `payhere` object that the
// PayHere script attaches to `window` — declare it so we can use it safely.
declare global {
  interface Window {
    payhere: {
      startPayment: (payload: Record<string, unknown>) => void;
      // PayHere's SDK doesn't take these as method calls — it reads these
      // as plain callback properties you assign directly (see their docs).
      onCompleted: (orderId: string) => void;
      onDismissed: () => void;
      onError: (message: string) => void;
    };
  }
}

interface CheckoutParams {
  merchantId: string;
  orderId: string;
  amount: string;
  currency: string;
  hash: string;
}

interface SubscriptionStatus {
  isPremium: boolean;
  expiresAt: string | null;
}

// Ask our backend to prepare a checkout (order id + secure hash), then open
// the PayHere popup with those exact values. We never touch the merchant
// secret here — only the backend knows it.
export async function startUpgrade(userEmail: string, onDone: (success: boolean) => void) {
  const checkout: CheckoutParams = await apiFetch('/api/Payments/initiate', {
    method: 'POST',
    body: JSON.stringify({ amount: 990 }),
  });

  window.payhere.onCompleted = () => onDone(true);
  window.payhere.onDismissed = () => onDone(false);
  window.payhere.onError = () => onDone(false);

  window.payhere.startPayment({
    sandbox: true, // flip to false once you move to a live PayHere account
    merchant_id: checkout.merchantId,
    return_url: undefined,
    cancel_url: undefined,
    notify_url: 'https://jersey-atop-semester.ngrok-free.dev/api/Payments/notify',
    order_id: checkout.orderId,
    items: 'iMath Premium — 1 month',
    amount: checkout.amount,
    currency: checkout.currency,
    hash: checkout.hash,
    first_name: userEmail.split('@')[0],
    last_name: '',
    email: userEmail,
    phone: '0770000000',
    address: 'N/A',
    city: 'Colombo',
    country: 'Sri Lanka',
  });
}

export function getSubscriptionStatus() {
  return apiFetch<SubscriptionStatus>('/api/Payments/status');
}