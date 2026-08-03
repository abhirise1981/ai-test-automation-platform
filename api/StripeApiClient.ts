import type { APIRequestContext, APIResponse } from '@playwright/test';
import * as crypto from 'crypto';
import { environmentConfig } from '../config/envConfig';
import { testConfig } from '../config/testConfig';

export interface StripeCustomer {
  id: string;
  object: 'customer';
  email: string;
  name?: string;
  metadata?: Record<string, string>;
  created: number;
  currency?: string;
  delinquent?: boolean;
}

export interface StripePaymentIntent {
  id: string;
  object: 'payment_intent';
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  customer?: string;
  client_secret?: string;
  payment_method?: string;
  metadata?: Record<string, string>;
  created: number;
}

export interface StripeRefund {
  id: string;
  object: 'refund';
  amount: number;
  currency: string;
  payment_intent: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  created: number;
}

export interface StripeSubscription {
  id: string;
  object: 'subscription';
  customer: string;
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        unit_amount: number;
        currency: string;
      };
    }>;
  };
  metadata?: Record<string, string>;
}

export interface StripeWebhookEvent<T = any> {
  id: string;
  object: 'event';
  api_version: string;
  created: number;
  type: string;
  data: {
    object: T;
  };
  livemode: boolean;
  pending_webhooks: number;
  request?: {
    id: string | null;
    idempotency_key: string | null;
  };
}

/**
 * StripeApiClient — Enterprise-grade Service Object Model for Stripe Billing & Payments
 *
 * Provides a unified API layer for:
 * 1. Customer lifecycle management (Subscriptions, Clinical SaaS Tiers)
 * 2. PaymentIntent workflows (Authorizations, Captures, Idempotent charges)
 * 3. Refunds & Dispute simulations
 * 4. Webhook cryptographic HMAC-SHA256 signature construction & verification
 */
export class StripeApiClient {
  private readonly request: APIRequestContext;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly webhookSecret: string;

  constructor(request: APIRequestContext, apiKey?: string, webhookSecret?: string) {
    this.request = request;
    this.baseUrl = environmentConfig.stripeApiBaseUrl;
    this.apiKey = apiKey || testConfig.stripe.apiKey;
    this.webhookSecret = webhookSecret || testConfig.stripe.webhookSecret;
  }

  /**
   * Helper to format request headers for Stripe API (Bearer auth + URL encoded or JSON)
   */
  private getHeaders(idempotencyKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return headers;
  }

  /**
   * Converts a nested JavaScript object to application/x-www-form-urlencoded format for Stripe API
   */
  private serializeFormData(obj: Record<string, any>, prefix = ''): string {
    const params: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue;
      const propName = prefix ? `${prefix}[${key}]` : key;
      if (typeof value === 'object' && !Array.isArray(value)) {
        params.push(this.serializeFormData(value, propName));
      } else {
        params.push(`${encodeURIComponent(propName)}=${encodeURIComponent(String(value))}`);
      }
    }
    return params.filter(Boolean).join('&');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. CUSTOMERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /v1/customers — Create a new clinical subscriber/customer
   */
  async createCustomer(params: {
    email: string;
    name?: string;
    description?: string;
    metadata?: Record<string, string>;
    payment_method?: string;
  }): Promise<APIResponse> {
    const body = this.serializeFormData(params);
    return await this.request.post(`${this.baseUrl}/customers`, {
      headers: this.getHeaders(),
      data: body,
    });
  }

  /**
   * GET /v1/customers/:id — Retrieve customer details
   */
  async getCustomer(customerId: string): Promise<APIResponse> {
    return await this.request.get(`${this.baseUrl}/customers/${customerId}`, {
      headers: this.getHeaders(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. PAYMENT INTENTS (Modern Stripe Checkout & Subscription Billing)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /v1/payment_intents — Create a PaymentIntent with optional idempotency key
   */
  async createPaymentIntent(
    params: {
      amount: number;
      currency: string;
      customer?: string;
      payment_method?: string;
      confirm?: boolean;
      return_url?: string;
      metadata?: Record<string, string>;
      automatic_payment_methods?: { enabled: boolean; allow_redirects?: string };
    },
    idempotencyKey?: string
  ): Promise<APIResponse> {
    const body = this.serializeFormData(params);
    return await this.request.post(`${this.baseUrl}/payment_intents`, {
      headers: this.getHeaders(idempotencyKey),
      data: body,
    });
  }

  /**
   * POST /v1/payment_intents/:id/confirm — Confirm an existing PaymentIntent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    params?: { payment_method?: string; return_url?: string }
  ): Promise<APIResponse> {
    const body = params ? this.serializeFormData(params) : '';
    return await this.request.post(`${this.baseUrl}/payment_intents/${paymentIntentId}/confirm`, {
      headers: this.getHeaders(),
      data: body,
    });
  }

  /**
   * POST /v1/payment_intents/:id/cancel — Cancel a PaymentIntent
   */
  async cancelPaymentIntent(
    paymentIntentId: string,
    cancellationReason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'abandoned'
  ): Promise<APIResponse> {
    const body = cancellationReason ? this.serializeFormData({ cancellation_reason: cancellationReason }) : '';
    return await this.request.post(`${this.baseUrl}/payment_intents/${paymentIntentId}/cancel`, {
      headers: this.getHeaders(),
      data: body,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. REFUNDS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /v1/refunds — Issue full or partial refund
   */
  async createRefund(params: {
    payment_intent: string;
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, string>;
  }): Promise<APIResponse> {
    const body = this.serializeFormData(params);
    return await this.request.post(`${this.baseUrl}/refunds`, {
      headers: this.getHeaders(),
      data: body,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. SUBSCRIPTIONS (Clinical SaaS Recurring Billing)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /v1/subscriptions — Create a recurring subscription for clinical SaaS tiers
   */
  async createSubscription(params: {
    customer: string;
    items: Array<{ price: string; quantity?: number }>;
    metadata?: Record<string, string>;
  }): Promise<APIResponse> {
    const body = this.serializeFormData(params);
    return await this.request.post(`${this.baseUrl}/subscriptions`, {
      headers: this.getHeaders(),
      data: body,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. WEBHOOK SIGNATURE & EVENT UTILITIES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Constructs the official Stripe HMAC-SHA256 signature header (`t=...,v1=...`)
   * Used for end-to-end webhook integration testing against webhook endpoints.
   */
  constructWebhookSignature(payload: string, secret?: string, timestamp?: number): string {
    const effectiveSecret = secret || this.webhookSecret;
    const effectiveTimestamp = timestamp ?? Math.floor(Date.now() / 1000);
    const signedPayload = `${effectiveTimestamp}.${payload}`;
    const hmac = crypto.createHmac('sha256', effectiveSecret).update(signedPayload).digest('hex');
    return `t=${effectiveTimestamp},v1=${hmac}`;
  }

  /**
   * Verifies an incoming Stripe webhook signature header against expected secret
   * Ensures clinical SaaS webhook consumers reject forged/tampered events.
   */
  verifyWebhookSignature(
    payload: string,
    signatureHeader: string,
    secret?: string,
    toleranceSeconds = 300
  ): boolean {
    const effectiveSecret = secret || this.webhookSecret;
    if (!signatureHeader || !payload) return false;

    const parts = signatureHeader.split(',');
    let timestamp: number | null = null;
    const signatures: string[] = [];

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') {
        timestamp = parseInt(value, 10);
      } else if (key === 'v1') {
        signatures.push(value);
      }
    }

    if (timestamp === null || signatures.length === 0) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) {
      return false; // Signature expired / replay attack prevention
    }

    const expectedSignedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', effectiveSecret)
      .update(expectedSignedPayload)
      .digest('hex');

    return signatures.some((sig) => {
      try {
        return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSignature, 'hex'));
      } catch {
        return false;
      }
    });
  }

  /**
   * Generates a fully formed Stripe Webhook Event with cryptographic headers for test delivery
   */
  simulateWebhookEvent<T = any>(
    eventType: string,
    dataObject: T,
    secret?: string
  ): { event: StripeWebhookEvent<T>; payload: string; headers: Record<string, string> } {
    const event: StripeWebhookEvent<T> = {
      id: `evt_test_${crypto.randomBytes(12).toString('hex')}`,
      object: 'event',
      api_version: '2024-06-20',
      created: Math.floor(Date.now() / 1000),
      type: eventType,
      data: {
        object: dataObject,
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: `req_${crypto.randomBytes(8).toString('hex')}`,
        idempotency_key: `idemp_${crypto.randomBytes(8).toString('hex')}`,
      },
    };

    const payload = JSON.stringify(event);
    const signature = this.constructWebhookSignature(payload, secret);

    return {
      event,
      payload,
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature,
      },
    };
  }
}
