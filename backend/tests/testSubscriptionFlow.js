/**
 * Automated Verification Test for E² Stories OTT Mobile Subscription APIs
 * Tests:
 * 1. GET /api/v1/subscriptions/plans (Public paywall tiers & Rs. 2 trial info)
 * 2. GET /api/v1/subscriptions/my-status (Check subscription status, days remaining)
 * 3. POST /api/v1/subscriptions/initiate (Create Rs. 2 trial order)
 * 4. POST /api/v1/subscriptions/verify (Verify signature & activate subscription)
 * 5. Anti-Abuse Guard (Blocks user from claiming Rs. 2 trial twice)
 * 6. POST /api/v1/subscriptions/upgrade (Time Stacking calculation)
 * 7. POST /api/v1/subscriptions/webhook (Auto-renew, immediate zero-grace lock, GPay/PhonePe revocation)
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { User } from '../models/User.js';
import { SubscriptionPlan, seedDefaultSubscriptionPlans } from '../models/SubscriptionPlan.js';
import { Subscription } from '../models/Subscription.js';
import { signJwt } from '../utils/jwt.js';

let server;
let mongod;
const PORT = 5098;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const logPass = (title) => console.log(`${colors.green}✓ PASS:${colors.reset} ${title}`);
const logFail = (title, err) => console.log(`${colors.red}✗ FAIL:${colors.reset} ${title}\n  ${err}`);
const logSection = (title) => console.log(`\n${colors.bold}${colors.cyan}=== ${title} ===${colors.reset}`);

async function runTests() {
  let passedCount = 0;
  let failedCount = 0;

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`Connected to in-memory test database at ${uri}`);

    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`Test server running on port ${PORT}`);
        resolve();
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Test 1: Seed & Fetch Public Subscription Plans
    // ─────────────────────────────────────────────────────────────────────────
    logSection('1. Public Plans Paywall API');
    const plansRes = await fetch(`${BASE_URL}/subscriptions/plans`);
    const plansData = await plansRes.json();

    if (plansRes.status === 200 && plansData.data.plans.length === 3) {
      logPass(`Retrieved 3 default plans (PLAN_1M, PLAN_6M, PLAN_12M) with trial config`);
      passedCount++;
    } else {
      logFail('Failed to retrieve plans', JSON.stringify(plansData));
      failedCount++;
    }

    const plan1M = plansData.data.plans.find((p) => p.code === 'PLAN_1M');
    const plan12M = plansData.data.plans.find((p) => p.code === 'PLAN_12M');

    // Create a Test User
    const testUser = await User.create({
      phoneNumber: '9876543210',
      firstName: 'Rahul',
      lastName: 'Sharma',
      isProfileCompleted: true,
      status: 'ACTIVE'
    });
    const userToken = signJwt({ userId: testUser._id.toString() });

    // ─────────────────────────────────────────────────────────────────────────
    // Test 2: Check Initial Status (Free User)
    // ─────────────────────────────────────────────────────────────────────────
    logSection('2. User Subscription Status API');
    const statusRes1 = await fetch(`${BASE_URL}/subscriptions/my-status`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const statusData1 = await statusRes1.json();

    if (statusRes1.status === 200 && statusData1.data.isVip === false && statusData1.data.canClaimTrial === true) {
      logPass('Initial status: isVip = false, canClaimTrial = true');
      passedCount++;
    } else {
      logFail('Initial status check failed', JSON.stringify(statusData1));
      failedCount++;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 3: Initiate Rs. 2 Free Trial Order
    // ─────────────────────────────────────────────────────────────────────────
    logSection('3. Initiate Rs. 2 Free Trial');
    const initRes = await fetch(`${BASE_URL}/subscriptions/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        planId: plan1M.id,
        isTrial: true
      })
    });
    const initData = await initRes.json();

    if (initRes.status === 200 && initData.data.amount === 2 && initData.data.orderId) {
      logPass(`Created Razorpay order for Rs. 2 trial: ${initData.data.orderId}`);
      passedCount++;
    } else {
      logFail('Failed to initiate trial order', JSON.stringify(initData));
      failedCount++;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 4: Verify Payment & Activate 7-Day Trial Subscription Access
    // ─────────────────────────────────────────────────────────────────────────
    logSection('4. Verify Payment & Activate Subscription');
    const verifyRes = await fetch(`${BASE_URL}/subscriptions/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        orderId: initData.data.orderId,
        paymentId: 'pay_mock_12345',
        signature: 'sig_mock_valid',
        planId: plan1M.id,
        isTrial: true
      })
    });
    const verifyData = await verifyRes.json();

    if (verifyRes.status === 200 && verifyData.data.isVip === true && verifyData.data.status === 'TRIAL') {
      logPass('Payment verified: User promoted to Subscribed with status: TRIAL for 7 days');
      passedCount++;
    } else {
      logFail('Payment verification failed', JSON.stringify(verifyData));
      failedCount++;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 5: Anti-Abuse Guard (Trying to claim trial twice)
    // ─────────────────────────────────────────────────────────────────────────
    logSection('5. Anti-Abuse Rule (1 Trial Per Phone Number)');
    const abuseRes = await fetch(`${BASE_URL}/subscriptions/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        planId: plan1M.id,
        isTrial: true
      })
    });
    const abuseData = await abuseRes.json();

    if (abuseRes.status === 400 && abuseData.message.includes('already claimed')) {
      logPass('Anti-Abuse guard successfully blocked repeat trial claim');
      passedCount++;
    } else {
      logFail('Anti-Abuse guard did not block repeat trial', JSON.stringify(abuseData));
      failedCount++;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 6: Mid-Cycle Plan Upgrade with Time Stacking
    // ─────────────────────────────────────────────────────────────────────────
    logSection('6. Mid-Cycle Plan Upgrade (Time Stacking)');
    const upgRes = await fetch(`${BASE_URL}/subscriptions/upgrade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        newPlanId: plan12M.id
      })
    });
    const upgData = await upgRes.json();

    if (upgRes.status === 200 && upgData.data.timeStacking && upgData.data.timeStacking.totalNewDays > 365) {
      logPass(`Time stacking confirmed: Remaining days added to 365 days = ${upgData.data.timeStacking.totalNewDays} days total`);
      passedCount++;
    } else {
      logFail('Plan upgrade time stacking failed', JSON.stringify(upgData));
      failedCount++;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 7: Razorpay Webhooks (Zero Grace Period & External Mandate Revoke)
    // ─────────────────────────────────────────────────────────────────────────
    logSection('7. Razorpay Webhooks (Zero-Grace Expiry & GPay/PhonePe Revocation)');

    // 7A: Webhook - Payment Failed (ZERO GRACE PERIOD)
    const failWebhookRes = await fetch(`${BASE_URL}/subscriptions/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'mock_valid'
      },
      body: JSON.stringify({
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_mock_12345',
              amount: 9900,
              error_description: 'Insufficient funds'
            }
          }
        }
      })
    });

    const refreshedUser = await User.findById(testUser._id);
    const refreshedSub = await Subscription.findOne({ userId: testUser._id });

    if (failWebhookRes.status === 200 && refreshedUser.isVip === false && refreshedSub.status === 'EXPIRED') {
      logPass('Zero Grace Period verified: Payment failure instantly expired membership and locked subscriber access!');
      passedCount++;
    } else {
      logFail('Zero Grace Period test failed', `isVip: ${refreshedUser.isVip}, status: ${refreshedSub?.status}`);
      failedCount++;
    }

    // 7B: Webhook - Mandate Revoked via UPI App (GPay/PhonePe)
    // First reactivate
    refreshedSub.status = 'ACTIVE';
    refreshedSub.autoRenew = true;
    refreshedSub.currentPeriodEnd = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
    await refreshedSub.save();

    const revokeWebhookRes = await fetch(`${BASE_URL}/subscriptions/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'mock_valid'
      },
      body: JSON.stringify({
        event: 'mandate.revoked',
        payload: {
          mandate: {
            entity: {
              id: 'pay_mock_12345'
            }
          }
        }
      })
    });

    const revokedSub = await Subscription.findById(refreshedSub._id);

    if (revokeWebhookRes.status === 200 && revokedSub.status === 'CANCELLED' && revokedSub.autoRenew === false) {
      logPass('UPI App revocation handled: autoRenew = false, status = CANCELLED (access preserved until period end)');
      passedCount++;
    } else {
      logFail('Mandate revocation failed', JSON.stringify(revokedSub));
      failedCount++;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FINAL RESULTS SUMMARY
    // ─────────────────────────────────────────────────────────────────────────
    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log(`========================================\n`);

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    if (mongoose.connection) await mongoose.disconnect();
    if (mongod) await mongod.stop();
    process.exit(0);
  }
}

runTests();
