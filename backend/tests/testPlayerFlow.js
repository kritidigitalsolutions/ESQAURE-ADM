/**
 * Automated Verification Test for E² Stories OTT Player, Access & Drama APIs
 * Tests:
 * 1. GET /api/v1/dramas (All Dramas API with Pagination: page, limit, total, totalPages)
 * 2. GET /api/v1/dramas/:id (Single Drama Details)
 * 3. GET /api/v1/player/access/:dramaId/:episodeNumber (Access Check: Free Episode -> hasAccess: true)
 * 4. GET /api/v1/player/access/:dramaId/4 (Access Check: Locked Episode for Free User -> hasAccess: false, reason: SUBSCRIPTION_REQUIRED)
 * 5. GET /api/v1/player/access/:dramaId/4 (Access Check: Locked Episode for VIP User -> hasAccess: true)
 * 6. GET /api/v1/player/play/:dramaId/2 (Play Stream - Short Route Name)
 * 7. GET /api/v1/player/episodes/:dramaId?page=1&limit=2 (Episodes Drawer with Pagination)
 * 8. POST /api/v1/player/progress (Playback Progress Sync)
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { User } from '../models/User.js';
import { Drama } from '../models/Drama.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { seedDefaultGenres } from '../config/seedGenres.js';
import { seedDefaultDramas } from '../config/seedDramas.js';
import { signJwt } from '../utils/jwt.js';

let server;
let mongod;
const PORT = 5099;
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

async function req(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
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
    console.log(`Test server running at ${BASE_URL}`);

    // Seed genres and default drama
    await seedDefaultGenres();
    await seedDefaultDramas();

    // Ensure sample subscription plan for paywall CTA
    await SubscriptionPlan.create({
      code: 'MONTHLY',
      name: 'Monthly Pass',
      price: 199,
      originalPrice: 299,
      durationDays: 30,
      features: ['Unlock all paywalled episodes (Episode 4+)', 'HD Streaming', 'No Ads'],
      status: 'ACTIVE'
    });

    // Create a regular user and a subscribed user
    const freeUser = await User.create({
      phoneNumber: '9876543210',
      countryCode: '+91',
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'rahul@example.com',
      isVip: false,
      status: 'ACTIVE'
    });
    const freeToken = signJwt({ userId: freeUser._id.toString() });

    const vipUser = await User.create({
      phoneNumber: '9876543211',
      countryCode: '+91',
      firstName: 'Priya',
      lastName: 'Verma',
      email: 'priya@example.com',
      isVip: true,
      vipExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE'
    });
    const vipToken = signJwt({ userId: vipUser._id.toString() });

    const drama = await Drama.findOne({ slug: 'security-guard-ki-ceo-gf' });
    if (!drama) throw new Error('Seeded drama not found');

    // ─────────────────────────────────────────────────────────────────────────
    // Test 1: All Dramas API with Pagination
    // ─────────────────────────────────────────────────────────────────────────
    logSection('1. All Dramas API with Pagination');
    {
      const res = await req('GET', '/dramas?page=1&limit=5');
      if (
        res.status === 200 &&
        res.data.success &&
        Array.isArray(res.data.data.dramas) &&
        res.data.data.pagination &&
        res.data.data.pagination.page === 1 &&
        res.data.data.pagination.limit === 5 &&
        res.data.data.pagination.total >= 1
      ) {
        logPass('GET /dramas returns paginated list with total, page, limit and totalPages');
        passed++;
      } else {
        logFail('GET /dramas failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 2: Single Drama Details API
    // ─────────────────────────────────────────────────────────────────────────
    logSection('2. Single Drama Details API');
    {
      const res = await req('GET', `/dramas/${drama.slug}`, null, freeToken);
      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.drama.slug === drama.slug &&
        res.data.data.drama.genreDisplay.includes('Romance')
      ) {
        logPass('GET /dramas/:id returns drama details and genres');
        passed++;
      } else {
        logFail('GET /dramas/:id failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 3: Access Check API (Free Episode 2)
    // ─────────────────────────────────────────────────────────────────────────
    logSection('3. Access Check API (Free Episode 2)');
    {
      const res = await req('GET', `/player/access/${drama.slug}/2`, null, freeToken);
      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.hasAccess === true &&
        res.data.data.reason === 'FREE_EPISODE' &&
        res.data.data.isFree === true
      ) {
        logPass('GET /player/access/:dramaId/2 evaluates hasAccess: true for free episode');
        passed++;
      } else {
        logFail('GET /player/access/:dramaId/2 failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 3b: Access Check API without Auth Token (Must Fail with 401)
    // ─────────────────────────────────────────────────────────────────────────
    logSection('3b. Access Check API without Auth Token (Must Fail with 401)');
    {
      const res = await req('GET', `/player/access/${drama.slug}/2`, null, null);
      if (
        res.status === 401 &&
        res.data.success === false
      ) {
        logPass('GET /player/access/:dramaId/2 without auth token is rejected with 401 AUTH_REQUIRED');
        passed++;
      } else {
        logFail('GET /player/access without token was expected to fail with 401', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 4: Access Check API (Locked Episode 4 for Free User)
    // ─────────────────────────────────────────────────────────────────────────
    logSection('4. Access Check API (Locked Episode 4 for Free User)');
    {
      const res = await req('GET', `/player/access/${drama.slug}/4`, null, freeToken);
      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.hasAccess === false &&
        res.data.data.reason === 'SUBSCRIPTION_REQUIRED' &&
        res.data.data.upgradePlans.length > 0
      ) {
        logPass('GET /player/access/:dramaId/4 evaluates hasAccess: false and provides upgradePlans');
        passed++;
      } else {
        logFail('GET /player/access/:dramaId/4 failed for free user', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 5: Access Check API (Locked Episode 4 for VIP User)
    // ─────────────────────────────────────────────────────────────────────────
    logSection('5. Access Check API (Locked Episode 4 for VIP User)');
    {
      const res = await req('GET', `/player/access/${drama.slug}/4`, null, vipToken);
      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.hasAccess === true &&
        res.data.data.reason === 'ACTIVE_VIP_SUBSCRIPTION'
      ) {
        logPass('GET /player/access/:dramaId/4 evaluates hasAccess: true for VIP user');
        passed++;
      } else {
        logFail('GET /player/access/:dramaId/4 failed for VIP user', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 6: Play Stream API (Short Name /play)
    // ─────────────────────────────────────────────────────────────────────────
    logSection('6. Play Stream API (Short Name /play)');
    {
      const res = await req('GET', `/player/play/${drama.slug}/2`, null, freeToken);
      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.streamUrl &&
        res.data.data.episode.episodeNumber === 2 &&
        res.data.data.episode.seasonEpisodeTag === 'S1 · E02'
      ) {
        logPass('GET /player/play/:dramaId/2 returns streamUrl and S1 · E02 metadata');
        passed++;
      } else {
        logFail('GET /player/play/:dramaId/2 failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 7: Episodes Drawer with Pagination
    // ─────────────────────────────────────────────────────────────────────────
    logSection('7. Episodes Drawer with Pagination');
    {
      const res = await req('GET', `/player/episodes/${drama.slug}?page=1&limit=2&current=2`, null, freeToken);
      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.episodes.length === 2 &&
        res.data.data.pagination &&
        res.data.data.pagination.page === 1 &&
        res.data.data.pagination.limit === 2 &&
        res.data.data.pagination.total >= 4 &&
        res.data.data.pagination.hasNextPage === true
      ) {
        logPass('GET /player/episodes/:dramaId?page=1&limit=2 returns paginated episode slice');
        passed++;
      } else {
        logFail('GET /player/episodes/:dramaId pagination failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 8: Progress Sync API
    // ─────────────────────────────────────────────────────────────────────────
    logSection('8. Progress Sync API');
    {
      const res = await req(
        'POST',
        '/player/progress',
        {
          dramaId: drama._id.toString(),
          episodeNumber: 2,
          watchedSeconds: 45,
          durationSeconds: 135
        },
        freeToken
      );

      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.watchedSeconds === 45 &&
        res.data.data.formattedWatched === '0:45' &&
        res.data.data.formattedDuration === '2:15' &&
        res.data.data.progressPercentage === 33.3
      ) {
        logPass('POST /player/progress recorded 0:45 / 2:15 progress');
        passed++;
      } else {
        logFail('POST /player/progress failed', JSON.stringify(res.data));
        failed++;
      }
    }

    console.log(`\n=================================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
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
