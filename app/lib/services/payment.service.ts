/**
 * Payment Service - Integración con Stripe y PayPal
 * - Gestión de payment intents
 * - Procesamiento de pagos
 * - Manejo de webhooks
 * - Reembolsos
 */

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  apiVersion: string;
}

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  webhookId: string;
  mode: 'sandbox' | 'live';
}

export interface CreatePaymentOptions {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
  paymentMethodId?: string;
}

export interface RefundOptions {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
}

/**
 * Stripe Payment Service
 */
export class StripePaymentService {
  private apiKey: string;
  private webhookSecret: string;

  constructor(apiKey: string, webhookSecret: string) {
    this.apiKey = apiKey;
    this.webhookSecret = webhookSecret;
  }

  /**
   * Crea un Payment Intent
   */
  async createPaymentIntent(options: CreatePaymentOptions) {
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: (options.amount * 100).toString(), // Stripe usa centavos
        currency: options.currency.toLowerCase(),
        ...(options.description && { description: options.description }),
        ...(options.paymentMethodId && { payment_method: options.paymentMethodId }),
        ...(options.paymentMethodId && { confirm: 'true' }),
        'metadata[source]': 'guaira_app',
        ...Object.entries(options.metadata || {}).reduce((acc, [key, value]) => ({
          ...acc,
          [`metadata[${key}]`]: value,
        }), {}),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Confirma un Payment Intent
   */
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        payment_method: paymentMethodId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Crea un reembolso
   */
  async createRefund(options: RefundOptions) {
    const response = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        payment_intent: options.paymentIntentId,
        ...(options.amount && { amount: (options.amount * 100).toString() }),
        ...(options.reason && { reason: options.reason }),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Verifica firma de webhook
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Implementación básica - en producción usar crypto.timingSafeEqual
    const crypto = require('crypto');
    const computedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return signature.includes(computedSignature);
  }

  /**
   * Obtiene un Payment Intent
   */
  async getPaymentIntent(paymentIntentId: string) {
    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }
}

/**
 * PayPal Payment Service
 */
export class PayPalPaymentService {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;

  constructor(clientId: string, clientSecret: string, mode: 'sandbox' | 'live' = 'sandbox') {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = mode === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  /**
   * Obtiene access token
   */
  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error('Failed to get PayPal access token');
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Crea una orden de PayPal
   */
  async createOrder(options: CreatePaymentOptions) {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: options.currency.toUpperCase(),
            value: options.amount.toFixed(2),
          },
          description: options.description,
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayPal error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Captura una orden de PayPal
   */
  async captureOrder(orderId: string) {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayPal error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Crea un reembolso
   */
  async createRefund(captureId: string, amount?: number, currency?: string) {
    const accessToken = await this.getAccessToken();

    const body: any = {};
    if (amount && currency) {
      body.amount = {
        value: amount.toFixed(2),
        currency_code: currency.toUpperCase(),
      };
    }

    const response = await fetch(`${this.baseUrl}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayPal error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Obtiene detalles de una orden
   */
  async getOrder(orderId: string) {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayPal error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Verifica webhook signature
   */
  async verifyWebhookSignature(
    transmissionId: string,
    transmissionTime: string,
    certUrl: string,
    authAlgo: string,
    transmissionSig: string,
    webhookId: string,
    webhookEvent: any
  ): Promise<boolean> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.verification_status === 'SUCCESS';
  }
}

/**
 * Inicializar servicios de pago
 */
export function initializePaymentServices() {
  const stripeService = new StripePaymentService(
    process.env.STRIPE_SECRET_KEY!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  const paypalService = new PayPalPaymentService(
    process.env.PAYPAL_CLIENT_ID!,
    process.env.PAYPAL_CLIENT_SECRET!,
    (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox'
  );

  return {
    stripe: stripeService,
    paypal: paypalService,
  };
}
