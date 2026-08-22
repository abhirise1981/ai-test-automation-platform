import { test, expect } from '@playwright/test';
import { StripeApiClient, StripePaymentIntent, StripeSubscription } from '../../api/StripeApiClient';
import { testConfig } from '../../config/testConfig';

test.describe('Stripe Billing & Clinical SaaS Payment API Suite', () => {
  let stripeClient: StripeApiClient;

  test.beforeEach(async ({ request }) => {
    stripeClient = new StripeApiClient(request);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 1. WEBHOOK CRYPTOGRAPHIC SIGNATURE & REPLAY SECURITY TESTS
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('Webhook Cryptographic Security & Verification', () => {
    test('TC-STRIPE-01: Should generate valid HMAC-SHA256 Stripe-Signature header', { tag: '@smoke' }, async () => {
      const payload = JSON.stringify({ id: 'evt_test_123', type: 'payment_intent.succeeded' });
      const secret = testConfig.stripe.webhookSecret;

      const signatureHeader = stripeClient.constructWebhookSignature(payload, secret);

      expect(signatureHeader).toContain('t=');
      expect(signatureHeader).toContain('v1=');

      const isValid = stripeClient.verifyWebhookSignature(payload, signatureHeader, secret);
      expect(isValid).toBe(true);
    });

    test('TC-STRIPE-02: Should reject tampered or forged webhook payloads (Data Integrity)', async () => {
      const originalPayload = JSON.stringify({ id: 'evt_clinical_001', amount: 49900 });
      const tamperedPayload = JSON.stringify({ id: 'evt_clinical_001', amount: 9900 }); // Price tampered!
      const secret = testConfig.stripe.webhookSecret;

      const validHeader = stripeClient.constructWebhookSignature(originalPayload, secret);

      // Verify tampered payload fails cryptographic validation
      const isValid = stripeClient.verifyWebhookSignature(tamperedPayload, validHeader, secret);
      expect(isValid).toBe(false);
    });

    test('TC-STRIPE-03: Should reject expired webhook signatures to prevent Replay Attacks', async () => {
      const payload = JSON.stringify({ id: 'evt_replay_attack', type: 'charge.refunded' });
      const secret = testConfig.stripe.webhookSecret;
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago (tolerance is 5 min)

      const expiredHeader = stripeClient.constructWebhookSignature(payload, secret, oldTimestamp);
      const isValid = stripeClient.verifyWebhookSignature(payload, expiredHeader, secret, 300);

      expect(isValid).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. CLINICAL SAAS LIFECYCLE WEBHOOK SIMULATIONS
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('Clinical SaaS Subscription & Billing Lifecycle Events', () => {
    test('TC-STRIPE-04: Should simulate payment_intent.succeeded for AI Transcription plan upgrade', async () => {
      const paymentIntentData: Partial<StripePaymentIntent> = {
        id: 'pi_test_clinical_pro_9941',
        amount: testConfig.stripe.plans.clinicalPro.amountCents,
        currency: 'usd',
        status: 'succeeded',
        customer: 'cus_doctor_john_doe',
        metadata: {
          organization: 'St. Jude Clinical Research',
          tier: 'Clinical AI Pro (Real-time Transcription)',
          hipaaCompliant: 'true',
        },
      };

      const webhook = stripeClient.simulateWebhookEvent('payment_intent.succeeded', paymentIntentData);

      expect(webhook.event.type).toBe('payment_intent.succeeded');
      expect(webhook.event.data.object.amount).toBe(49900);
      expect(webhook.event.data.object.metadata?.tier).toContain('Clinical AI Pro');
      expect(webhook.headers['Stripe-Signature']).toBeDefined();

      // Ensure signature on the generated event is cryptographically authentic
      const isValid = stripeClient.verifyWebhookSignature(webhook.payload, webhook.headers['Stripe-Signature']);
      expect(isValid).toBe(true);
    });

    test('TC-STRIPE-05: Should simulate invoice.payment_failed for graceful SaaS access restriction', async () => {
      const invoiceData = {
        id: 'in_test_failed_881',
        customer: 'cus_clinic_downtown',
        amount_due: 49900,
        attempt_count: 3,
        next_payment_attempt: null,
        billing_reason: 'subscription_cycle',
      };

      const webhook = stripeClient.simulateWebhookEvent('invoice.payment_failed', invoiceData);

      expect(webhook.event.type).toBe('invoice.payment_failed');
      expect(webhook.event.data.object.attempt_count).toBe(3);
      expect(webhook.headers['Content-Type']).toBe('application/json');

      const isValid = stripeClient.verifyWebhookSignature(webhook.payload, webhook.headers['Stripe-Signature']);
      expect(isValid).toBe(true);
    });

    test('TC-STRIPE-06: Should simulate customer.subscription.deleted for archiving clinical records', async () => {
      const subscriptionData: Partial<StripeSubscription> = {
        id: 'sub_enterprise_7721',
        customer: 'cus_hospital_general',
        status: 'canceled',
        metadata: {
          retentionPolicy: 'HIPAA_7_YEAR_ARCHIVE',
        },
      };

      const webhook = stripeClient.simulateWebhookEvent('customer.subscription.deleted', subscriptionData);

      expect(webhook.event.type).toBe('customer.subscription.deleted');
      expect(webhook.event.data.object.status).toBe('canceled');
      expect(webhook.event.data.object.metadata?.retentionPolicy).toBe('HIPAA_7_YEAR_ARCHIVE');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. STRIPE API CLIENT METHOD FORM & REQUEST VALIDATION
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('Stripe Client Service Layer Serialization & Schema', () => {
    test('TC-STRIPE-07: Should verify client instantiates with correct environment defaults', () => {
      expect(stripeClient).toBeDefined();
      expect(testConfig.stripe.plans.clinicalStarter.amountCents).toBe(9900);
      expect(testConfig.stripe.plans.clinicalEnterprise.amountCents).toBe(499900);
      expect(testConfig.stripe.testTokens.declinedGeneric).toBe('tok_chargeDeclined');
    });
  });
});
