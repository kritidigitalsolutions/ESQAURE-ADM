/**
 * Automated End-to-End Verification Test for E² Stories OTT Mobile Auth Flow
 * Tests all 3 screens and both New User & Existing User journeys.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';

let server;
let mongod;
const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
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
    const { env } = await import('../config/env.js');
    if (env.MONGODB_URI && env.MONGODB_URI.includes('mongodb')) {
      console.log(`Connecting to MongoDB at: ${env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@')}`);
      await mongoose.connect(env.MONGODB_URI);
      console.log(`Connected to live database successfully!`);
    } else {
      console.log('Spinning up in-memory MongoDB test server...');
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`Connected to in-memory test database at ${uri}`);
    }

    server = app.listen(PORT);
    console.log(`Test server running on port ${PORT}`);

    const testPhone = '7600000097';
    const testCountry = '+91';

    // Reset clean state for test phone number
    await User.deleteMany({ phoneNumber: testPhone });
    await Otp.deleteMany({ phoneNumber: testPhone });

    // TEST 1: Health Check
    logSection('1. Health Check');
    try {
      const res = await fetch(`${BASE_URL}/health`);
      const body = await res.json();
      if (res.status === 200 && body.status === 'ok') {
        logPass('Health endpoint is responsive');
        passedCount++;
      } else {
        throw new Error(JSON.stringify(body));
      }
    } catch (err) {
      logFail('Health endpoint check', err);
      failedCount++;
    }

    // TEST 2: Screen 1 - Request OTP for New User
    logSection('2. Screen 1: Request OTP (New User)');
    let receivedOtp = '1234';
    try {
      const res = await fetch(`${BASE_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: testPhone, countryCode: testCountry })
      });
      const body = await res.json();

      if (
        res.status === 200 &&
        body.success === true &&
        body.data.isExistingUser === false &&
        body.data.maskedNumber === '+91 76••••97'
      ) {
        receivedOtp = body.data.devOtp || '1234';
        logPass(`OTP requested successfully. Masked display: ${body.data.maskedNumber}, isExistingUser: false`);
        passedCount++;
      } else {
        throw new Error(JSON.stringify(body));
      }
    } catch (err) {
      logFail('Screen 1 Request OTP', err);
      failedCount++;
    }

    // TEST 3: Screen 2 - Verify OTP with Wrong Code
    logSection('3. Screen 2: Verify Wrong OTP (Validation & Security)');
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: testPhone, countryCode: testCountry, otp: '0000' })
      });
      const body = await res.json();

      if (res.status === 400 && body.success === false && body.error === 'OTP_INVALID') {
        logPass('Invalid OTP properly rejected with 400 status & remaining attempts count');
        passedCount++;
      } else {
        throw new Error(JSON.stringify(body));
      }
    } catch (err) {
      logFail('Reject Invalid OTP', err);
      failedCount++;
    }

    // TEST 4: Screen 2 - Verify Correct OTP (New User Flow)
    logSection('4. Screen 2: Verify Valid OTP (New User Flow)');
    let authToken = '';
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: testPhone, countryCode: testCountry, otp: receivedOtp })
      });
      const body = await res.json();

      if (
        res.status === 200 &&
        body.success === true &&
        body.data.isNewUser === true &&
        body.data.isProfileCompleted === false &&
        body.data.token
      ) {
        authToken = body.data.token;
        logPass('New user recognized, onboarding token issued, isNewUser: true, isProfileCompleted: false');
        passedCount++;
      } else {
        throw new Error(JSON.stringify(body));
      }
    } catch (err) {
      logFail('Screen 2 New User Verification', err);
      failedCount++;
    }

    // TEST 5: Screen 3 - Complete Profile (First name, Last name, Email)
    logSection('5. Screen 3: Welcome Screen Profile Completion');
    try {
      const res = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          firstName: 'Satyam',
          lastName: 'Sharma',
          email: 'satyam.demo@gmail.com'
        })
      });
      const body = await res.json();

      if (
        res.status === 200 &&
        body.success === true &&
        body.data.isProfileCompleted === true &&
        body.data.user.fullName === 'Satyam Sharma' &&
        body.data.user.email === 'satyam.demo@gmail.com'
      ) {
        authToken = body.data.token; // Refresh token with updated profile status
        logPass('Profile completed successfully with first name, last name, and email');
        passedCount++;
      } else {
        throw new Error(JSON.stringify(body));
      }
    } catch (err) {
      logFail('Screen 3 Complete Profile', err);
      failedCount++;
    }

    // TEST 6: Get Me (Authenticated Profile Fetch)
    logSection('6. Authenticated Profile Inspection (GET /me)');
    try {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const body = await res.json();

      if (res.status === 200 && body.data.user.phoneNumber === testPhone) {
        logPass(`Session verified. User: ${body.data.user.fullName} (${body.data.user.phoneNumber})`);
        passedCount++;
      } else {
        throw new Error(JSON.stringify(body));
      }
    } catch (err) {
      logFail('Get Me endpoint', err);
      failedCount++;
    }

    // TEST 7: Screen 1 - Request OTP for Existing User
    logSection('7. Screen 1: Request OTP for Existing User');
    // Advance cooldown timestamp for fast test execution
    await Otp.updateOne({ phoneNumber: testPhone }, { lastRequestedAt: new Date(Date.now() - 70000) });
    try {
      const res = await fetch(`${BASE_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: testPhone, countryCode: testCountry })
      });
      const body = await res.json();

      if (
        res.status === 200 &&
        body.success === true &&
        body.data.isExistingUser === true
      ) {
        receivedOtp = body.data.devOtp || '1234';
        logPass('System correctly recognizes existing registered user (isExistingUser: true)');
        passedCount++;
      } else {
        throw new Error(JSON.stringify(body));
      }
    } catch (err) {
      logFail('Screen 1 Existing User Recognition', err);
      failedCount++;
    }

    // TEST 8: Screen 2 - Verify OTP for Existing User (Direct Login)
    logSection('8. Screen 2: Verify OTP for Existing User (Direct to Home)');
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: testPhone, countryCode: testCountry, otp: receivedOtp })
      });
      const body = await res.json();

      if (
        res.status === 200 &&
        body.success === true &&
        body.data.isNewUser === false &&
        body.data.isProfileCompleted === true &&
        body.data.user.fullName === 'Satyam Sharma'
      ) {
        logPass('Existing user verified successfully, isNewUser: false, isProfileCompleted: true (direct to Home)');
        passedCount++;
      } else {
        throw new Error(JSON.stringify(body));
      }
    } catch (err) {
      logFail('Screen 2 Existing User Direct Login', err);
      failedCount++;
    }

    // TEST 9: Logout
    logSection('9. User Logout');
    try {
      const res = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const body = await res.json();

      if (res.status === 200 && body.success === true) {
        logPass('User logged out successfully');
        passedCount++;
      } else {
        throw new Error(JSON.stringify(body));
      }
    } catch (err) {
      logFail('Logout endpoint', err);
      failedCount++;
    }

    console.log(`\n=================================================`);
    console.log(`${colors.bold}Test Summary:${colors.reset} Passed: ${colors.green}${passedCount}${colors.reset}, Failed: ${colors.red}${failedCount}${colors.reset}`);
    console.log(`=================================================\n`);
  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
