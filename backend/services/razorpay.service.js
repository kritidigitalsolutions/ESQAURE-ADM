import crypto from 'crypto';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

let razorpayInstance = null;

if (keyId && keySecret) {
  try {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
    console.log('[Razorpay] Initialized with Key ID:', keyId);
  } catch (err) {
    console.warn('[Razorpay] Failed to initialize live instance. Fallback active.', err.message);
  }
} else {
  console.log('[Razorpay] Keys not configured in .env. Running in Mock/Sandbox simulation mode.');
}

export class RazorpayService {
  /**
   * Get the Razorpay publishable Key ID for mobile app SDK
   */
  static getKeyId() {
    return keyId || 'rzp_test_mock_esquare_key_id';
  }

  /**
   * Check if live Razorpay keys are configured
   */
  static isConfigured() {
    return Boolean(keyId && keySecret && razorpayInstance);
  }

  /**
   * Create an order on Razorpay (or simulation in local dev mode)
   * @param {Object} params
   * @param {number} params.amountInPaise - e.g. 200 for Rs. 2, 9900 for Rs. 99
   * @param {string} params.currency - 'INR'
   * @param {string} params.receipt - Internal reference
   * @param {Object} [params.notes] - Custom metadata
   */
  static async createOrder({ amountInPaise, currency = 'INR', receipt, notes = {} }) {
    if (this.isConfigured()) {
      return await razorpayInstance.orders.create({
        amount: Math.round(amountInPaise),
        currency,
        receipt: receipt.slice(0, 40),
        notes
      });
    }

    // Dev / Test simulation mode
    return {
      id: `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entity: 'order',
      amount: Math.round(amountInPaise),
      amount_paid: 0,
      amount_due: Math.round(amountInPaise),
      currency,
      receipt,
      status: 'created',
      notes,
      created_at: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * Verify standard Razorpay payment signature
   * generated on client app: HMAC_SHA256(order_id + "|" + payment_id, secret)
   */
  static verifyPaymentSignature({ orderId, paymentId, signature }) {
    if (!signature) return false;

    // In dev simulation mode with mock order
    if (orderId && orderId.startsWith('order_mock_')) {
      return true;
    }

    if (!keySecret) {
      console.warn('[Razorpay] No secret configured; permitting signature in non-prod mode.');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Verify Razorpay Webhook signature
   * @param {string|Buffer} rawBody
   * @param {string} signature - Header 'x-razorpay-signature'
   */
  static verifyWebhookSignature(rawBody, signature) {
    if (!webhookSecret) return true; // If secret not yet configured, allow in dev
    if (!signature) return false;

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
      .digest('hex');

    return expectedSignature === signature;
  }
}
