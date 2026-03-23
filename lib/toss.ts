// Server-only — TOSS_SECRET_KEY must never reach the client

function getAuthHeader(): string {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) throw new Error("TOSS_SECRET_KEY is not configured");
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

const TOSS_API = "https://api.tosspayments.com/v1";

interface ConfirmPaymentParams {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface TossPayment {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  approvedAt: string;
  receipt?: { url: string };
}

export async function confirmPayment(
  params: ConfirmPaymentParams
): Promise<TossPayment> {
  const res = await fetch(`${TOSS_API}/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Toss API error (${res.status})`);
  }
  return data;
}

interface IssueBillingKeyParams {
  authKey: string;
  customerKey: string;
}

export interface BillingKeyResponse {
  billingKey: string;
  customerKey: string;
  cardCompany: string;
  cardNumber: string;
}

export async function issueBillingKey(
  params: IssueBillingKeyParams
): Promise<BillingKeyResponse> {
  const res = await fetch(
    `${TOSS_API}/billing/authorizations/${params.authKey}`,
    {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ customerKey: params.customerKey }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Billing auth error (${res.status})`);
  }
  return data;
}

interface BillingPaymentParams {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
}

export async function chargeBilling(
  params: BillingPaymentParams
): Promise<TossPayment> {
  const res = await fetch(`${TOSS_API}/billing/${params.billingKey}`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerKey: params.customerKey,
      amount: params.amount,
      orderId: params.orderId,
      orderName: params.orderName,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Billing charge error (${res.status})`);
  }
  return data;
}
