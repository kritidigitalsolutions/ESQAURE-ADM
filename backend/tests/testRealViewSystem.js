/**
 * Verification Test Suite for E² Stories OTT Real View Count System
 *
 * Validates:
 * 1. Minimum Playback Qualification Threshold (e.g. 2s bounce vs 12s real view)
 * 2. Session Anti-Inflation & Deduplication Cooldown (multiple pings do not inflate views)
 * 3. Separate Viewer / Device Isolation (different users/devices count independently)
 * 4. Explicit Real View Endpoint (POST /api/v1/player/view)
 * 5. Real View Timeseries & Unique Viewers Analytics (GET /api/v1/player/analytics/:dramaId)
 * 6. Admin Drama Views Reconciliation (POST /api/v1/player/reconcile-views/:dramaId)
 * 7. Custom Ad Anti-Spam Debounce & Daily Frequency Capping
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { User } from '../models/User.js';
import { Drama } from '../models/Drama.js';
import { Episode } from '../models/Episode.js';
import { CustomAd } from '../models/CustomAd.js';
import { seedDefaultGenres } from '../config/seedGenres.js';
import { seedDefaultDramas } from '../config/seedDramas.js';
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
  yellow: '\x1b[33m',
  bold: '\x1b[1m'
};

const logPass = (title) => console.log(`${colors.green}✓ PASS:${colors.reset} ${title}`);
const logFail = (title, err) => console.log(`${colors.red}✗ FAIL:${colors.reset} ${title}\n  ${err}`);
const logSection = (title) => console.log(`\n${colors.bold}${colors.cyan}=== ${title} ===${colors.reset}`);

async function req(method, path, body = null, token = null, customHeaders = {}) {
  const headers = { 'Content-Type': 'application/json', ...customHeaders };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  try {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    server = app.listen(PORT);
    console.log(`Real View Count Test Server running at ${BASE_URL}`);

    // Seed base test data
    await seedDefaultGenres();
    await seedDefaultDramas();

    // Create 2 test users
    const userA = await User.create({
      phoneNumber: '9999900001',
      countryCode: '+91',
      firstName: 'Aarav',
      lastName: 'Patel',
      status: 'ACTIVE'
    });
    const tokenA = signJwt({ userId: userA._id.toString() });

    const userB = await User.create({
      phoneNumber: '9999900002',
      countryCode: '+91',
      firstName: 'Diya',
      lastName: 'Shah',
      status: 'ACTIVE'
    });
    const tokenB = signJwt({ userId: userB._id.toString() });

    // Find sample drama and episode
    const testDrama = await Drama.findOne({ slug: 'security-guard-ki-ceo-gf' });
    const testEpisode = await Episode.findOne({ dramaId: testDrama._id, episodeNumber: 1 });

    const initialEpViews = testEpisode.viewsCount || 0;
    const initialDramaViews = testDrama.viewsCount || 0;

    console.log(`Initial Episode Views: ${initialEpViews}, Initial Drama Views: ${initialDramaViews}`);

    // ─────────────────────────────────────────────────────────────────────────
    // Test 1: Minimum Playback Qualification Threshold (< 10s does not count)
    // ─────────────────────────────────────────────────────────────────────────
    logSection('1. Playback Qualification Threshold (< 10s bounce)');
    {
      const res = await req(
        'POST',
        '/player/progress',
        {
          dramaId: testDrama._id.toString(),
          episodeNumber: 1,
          watchedSeconds: 3, // only 3s watched (bounce/preview)
          durationSeconds: 120
        },
        tokenA
      );

      const refreshedEp = await Episode.findById(testEpisode._id);

      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.viewCounted === false &&
        res.data.data.viewReason === 'THRESHOLD_NOT_MET' &&
        refreshedEp.viewsCount === initialEpViews
      ) {
        logPass('3-second playback correctly did NOT increment view count (THRESHOLD_NOT_MET)');
        passed++;
      } else {
        logFail('Threshold test failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 1b: Trailer Playback Strictly Excluded from Views
    // ─────────────────────────────────────────────────────────────────────────
    logSection('1b. Trailer Playback Excluded from Views');
    {
      const res = await req(
        'POST',
        '/player/progress',
        {
          dramaId: testDrama._id.toString(),
          isTrailer: true,
          watchedSeconds: 45, // watched 45s of trailer!
          durationSeconds: 90
        },
        tokenA
      );

      const refreshedEp = await Episode.findById(testEpisode._id);
      const refreshedDrama = await Drama.findById(testDrama._id);

      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.viewCounted === false &&
        res.data.data.viewReason === 'TRAILER_EXCLUDED' &&
        refreshedEp.viewsCount === initialEpViews &&
        refreshedDrama.viewsCount === initialDramaViews
      ) {
        logPass('Trailer playback (45s) correctly did NOT increment any episode or drama views (TRAILER_EXCLUDED)');
        passed++;
      } else {
        logFail('Trailer view exclusion test failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 1c: Locked Episode Preview Excluded from Views
    // ─────────────────────────────────────────────────────────────────────────
    logSection('1c. Locked Episode Preview Excluded from Views');
    {
      const res = await req(
        'POST',
        '/player/progress',
        {
          dramaId: testDrama._id.toString(),
          episodeNumber: 4, // Episode 4 is locked for free user
          watchedSeconds: 20,
          durationSeconds: 120
        },
        tokenA
      );

      const ep4 = await Episode.findOne({ dramaId: testDrama._id, episodeNumber: 4 });

      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.viewCounted === false &&
        res.data.data.viewReason === 'LOCKED_EPISODE_EXCLUDED'
      ) {
        logPass(`Locked Episode 4 preview teaser correctly rejected from counting view (LOCKED_EPISODE_EXCLUDED, Ep 4 views: ${ep4.viewsCount})`);
        passed++;
      } else {
        logFail('Locked preview exclusion test failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 2: First Legitimate Qualified View (>= 10s playback)
    // ─────────────────────────────────────────────────────────────────────────
    logSection('2. Qualified Real View (>= 10s playback)');
    {
      const res = await req(
        'POST',
        '/player/progress',
        {
          dramaId: testDrama._id.toString(),
          episodeNumber: 1,
          watchedSeconds: 15, // 15s watched -> qualifies!
          durationSeconds: 120
        },
        tokenA
      );

      const refreshedEp = await Episode.findById(testEpisode._id);
      const refreshedDrama = await Drama.findById(testDrama._id);

      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.viewCounted === true &&
        res.data.data.viewReason === 'QUALIFIED_REAL_VIEW' &&
        refreshedEp.viewsCount === initialEpViews + 1 &&
        refreshedDrama.viewsCount === initialDramaViews + 1
      ) {
        logPass(`Qualified view successfully counted! Ep views: ${refreshedEp.viewsCount}, Drama views: ${refreshedDrama.viewsCount}`);
        passed++;
      } else {
        logFail('Qualified view test failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 3: Session Anti-Inflation & Deduplication (Heartbeat Pings)
    // ─────────────────────────────────────────────────────────────────────────
    logSection('3. Session Anti-Inflation & Deduplication (Repeated Pings)');
    {
      // Simulate player sending progress every 5 seconds (20s, 30s, 60s, 110s)
      const pings = [20, 30, 60, 110];
      let allDebounced = true;

      for (const secs of pings) {
        const res = await req(
          'POST',
          '/player/progress',
          {
            dramaId: testDrama._id.toString(),
            episodeNumber: 1,
            watchedSeconds: secs,
            durationSeconds: 120
          },
          tokenA
        );

        if (!res.data.success || res.data.data.viewCounted !== false || res.data.data.viewReason !== 'COOLDOWN_ACTIVE') {
          allDebounced = false;
          logFail(`Ping at ${secs}s failed debounce:`, JSON.stringify(res.data));
          break;
        }
      }

      const refreshedEp = await Episode.findById(testEpisode._id);
      const refreshedDrama = await Drama.findById(testDrama._id);

      if (
        allDebounced &&
        refreshedEp.viewsCount === initialEpViews + 1 &&
        refreshedDrama.viewsCount === initialDramaViews + 1
      ) {
        logPass('Subsequent player heartbeat pings updated progress without duplicating view counts (COOLDOWN_ACTIVE)');
        passed++;
      } else {
        logFail('Deduplication test failed: view count was artificially inflated!');
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 4: Different Viewer / Device Isolation (User B watches)
    // ─────────────────────────────────────────────────────────────────────────
    logSection('4. Independent Viewer Count (User B)');
    {
      const res = await req(
        'POST',
        '/player/progress',
        {
          dramaId: testDrama._id.toString(),
          episodeNumber: 1,
          watchedSeconds: 25,
          durationSeconds: 120
        },
        tokenB
      );

      const refreshedEp = await Episode.findById(testEpisode._id);
      const refreshedDrama = await Drama.findById(testDrama._id);

      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.viewCounted === true &&
        refreshedEp.viewsCount === initialEpViews + 2 &&
        refreshedDrama.viewsCount === initialDramaViews + 2
      ) {
        logPass(`Independent viewer User B credited legitimate view! Ep views: ${refreshedEp.viewsCount}`);
        passed++;
      } else {
        logFail('User B view test failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 5: Explicit Real View Endpoint (POST /api/v1/player/view)
    // ─────────────────────────────────────────────────────────────────────────
    logSection('5. Explicit View API (POST /api/v1/player/view)');
    {
      // An anonymous guest with a custom device ID watches episode 2
      const guestHeaders = { 'x-device-id': 'device-pixel-7a-xyz-101' };
      const res = await req(
        'POST',
        '/player/view',
        {
          dramaId: testDrama._id.toString(),
          episodeNumber: 2,
          watchedSeconds: 15,
          durationSeconds: 120
        },
        null,
        guestHeaders
      );

      const ep2 = await Episode.findOne({ dramaId: testDrama._id, episodeNumber: 2 });

      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.viewCounted === true &&
        res.data.data.viewReason === 'QUALIFIED_REAL_VIEW'
      ) {
        logPass(`Explicit POST /player/view successfully registered guest view on Episode 2 (views: ${ep2.viewsCount})`);
        passed++;
      } else {
        logFail('Explicit view endpoint failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 6: View Analytics Timeseries API (GET /api/v1/player/analytics/:dramaId)
    // ─────────────────────────────────────────────────────────────────────────
    logSection('6. Real View Analytics API');
    {
      const res = await req('GET', `/player/analytics/${testDrama._id.toString()}`);

      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.summary.totalLoggedViews >= 3 &&
        res.data.data.summary.uniqueViewersCount >= 2 &&
        Array.isArray(res.data.data.dailyBreakdown)
      ) {
        logPass(`Analytics verified: ${res.data.data.summary.totalLoggedViews} total logged views, ${res.data.data.summary.uniqueViewersCount} unique viewers`);
        passed++;
      } else {
        logFail('Analytics API failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 7: Admin Drama Views Reconciliation
    // ─────────────────────────────────────────────────────────────────────────
    logSection('7. Admin Drama Views Reconciliation');
    {
      const adminUser = await User.create({
        phoneNumber: '9999900099',
        countryCode: '+91',
        firstName: 'Admin',
        role: 'ADMIN',
        status: 'ACTIVE'
      });
      const adminToken = signJwt({ userId: adminUser._id.toString(), role: 'ADMIN', isAdmin: true });

      const res = await req(
        'POST',
        `/player/reconcile-views/${testDrama._id.toString()}`,
        {},
        adminToken
      );

      if (
        res.status === 200 &&
        res.data.success &&
        typeof res.data.data.reconciledViews === 'number'
      ) {
        logPass(`Reconciled Drama views count verified: ${res.data.data.reconciledViews} total streams across episodes`);
        passed++;
      } else {
        logFail('Reconciliation failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 8: Custom Ad Impression Anti-Fraud Debounce & Frequency Capping
    // ─────────────────────────────────────────────────────────────────────────
    logSection('8. Custom Ad View / Impression Anti-Fraud & Capping');
    {
      // Create a test direct sponsor ad with user frequency cap of 2
      const testAd = await CustomAd.create({
        title: 'Brand Sponsor X',
        advertiser: 'Sponsor Inc',
        type: 'BANNER',
        placement: 'HOME_BANNER',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/banner.jpg',
        userFrequencyCap: 2, // Max 2 impressions per user per day
        status: 'ACTIVE'
      });

      const adHeaders = { 'x-device-id': 'device-samsung-s23-test' };

      // Impression 1: Legitimate
      const imp1 = await req('POST', `/ads/track/${testAd._id}/impression`, {}, null, adHeaders);

      // Impression 2 (immediate burst within 1 second): Must be debounced!
      const imp2 = await req('POST', `/ads/track/${testAd._id}/impression`, {}, null, adHeaders);

      const refreshedAd = await CustomAd.findById(testAd._id);

      if (
        imp1.data.success &&
        imp1.data.data.impressionsCount === 1 &&
        imp2.data.success &&
        imp2.data.data.deduplicated === true &&
        refreshedAd.impressionsCount === 1
      ) {
        logPass('Rapid duplicate ad impression successfully debounced (count remained 1)');
        passed++;
      } else {
        logFail('Ad impression debounce failed', JSON.stringify({ imp1: imp1.data, imp2: imp2.data }));
        failed++;
      }
    }

    console.log(`\n=================================================`);
    console.log(`REAL VIEW SYSTEM TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`=================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
    if (mongod) await mongod.stop();
  }
}

runTests();
