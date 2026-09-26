/**
 * Automated Verification Test for E² Stories OTT Saved Series & User Library APIs
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { User } from '../models/User.js';
import { Drama } from '../models/Drama.js';
import { WatchHistory } from '../models/WatchHistory.js';
import { Episode } from '../models/Episode.js';
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

    await seedDefaultGenres();
    await seedDefaultDramas();

    const drama = await Drama.findOne();
    if (!drama) throw new Error('No dramas seeded in memory DB');

    const testUser = await User.create({
      phoneNumber: '9876543210',
      countryCode: '+91',
      firstName: 'Test',
      lastName: 'Viewer',
      status: 'ACTIVE',
      isVip: true
    });

    const userToken = signJwt({
      userId: testUser._id.toString(),
      phoneNumber: testUser.phoneNumber,
      isProfileCompleted: true
    });

    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`Test server running at http://localhost:${PORT}`);
        resolve();
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    logSection('1. Unauthorized Access Guard');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req('GET', '/user/saved-series');
      if (res.status === 401 && res.data.success === false) {
        logPass('GET /user/saved-series requires authentication (401)');
        passed++;
      } else {
        logFail('GET /user/saved-series unauthorized guard', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('2. Empty Saved Series Check');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req('GET', '/user/saved-series', null, userToken);
      if (
        res.status === 200 &&
        res.data.success === true &&
        Array.isArray(res.data.data.savedSeries) &&
        res.data.data.savedSeries.length === 0
      ) {
        logPass('GET /user/saved-series returns empty list initially');
        passed++;
      } else {
        logFail('Empty saved series list check', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('3. Toggle Save Drama (+ Watch Later)');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req('POST', `/user/saved-series/${drama._id}`, null, userToken);
      if (
        res.status === 201 &&
        res.data.success === true &&
        res.data.data.isSaved === true &&
        res.data.data.action === 'ADDED' &&
        res.data.data.totalSaved === 1
      ) {
        logPass(`POST /user/saved-series/:dramaId adds drama to watchlist (+): "${drama.title}"`);
        passed++;
      } else {
        logFail('Add to saved series failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('4. Check Drama Saved Status');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req('GET', `/user/saved-series/check/${drama._id}`, null, userToken);
      if (res.status === 200 && res.data.success === true && res.data.data.isSaved === true) {
        logPass('GET /user/saved-series/check/:dramaId confirms drama is saved');
        passed++;
      } else {
        logFail('Check drama saved status failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('5. List Saved Series with Drama Details & Watch Progress');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req('GET', '/user/saved-series', null, userToken);
      const first = res.data.data?.savedSeries?.[0];
      if (
        res.status === 200 &&
        res.data.data.savedSeries.length === 1 &&
        first.drama.title === drama.title &&
        first.watchProgress.actionLabel === 'Watch Now' &&
        first.isSaved === true
      ) {
        logPass('GET /user/saved-series returns populated drama and watch progress metadata');
        passed++;
      } else {
        logFail('List saved series validation failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('6. Integration with Watch History (Resume Playback)');
    // ─────────────────────────────────────────────────────────────────────────
    {
      // Simulate playback progress for this drama
      const episode = await Episode.findOne({ dramaId: drama._id });
      await WatchHistory.create({
        userId: testUser._id,
        dramaId: drama._id,
        episodeId: episode ? episode._id : new mongoose.Types.ObjectId(),
        episodeNumber: 3,
        watchedSeconds: 65,
        durationSeconds: 135,
        progressPercentage: 48,
        isCompleted: false
      });

      const res = await req('GET', '/user/saved-series', null, userToken);
      const first = res.data.data?.savedSeries?.[0];
      if (
        res.status === 200 &&
        first.watchProgress.hasStarted === true &&
        first.watchProgress.resumeEpisodeNumber === 3 &&
        first.watchProgress.actionLabel === 'Resume Ep 3'
      ) {
        logPass('GET /user/saved-series dynamically integrates with Watch History for Watch Later resume');
        passed++;
      } else {
        logFail('Watch history integration failed', JSON.stringify(first?.watchProgress));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('7. Drama Details Endpoint includes Watchlist Status');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req('GET', `/dramas/${drama._id}`, null, userToken);
      if (
        res.status === 200 &&
        res.data.data?.drama?.isSaved === true &&
        res.data.data?.drama?.isInWatchlist === true
      ) {
        logPass('GET /dramas/:id reflects isSaved: true and isInWatchlist: true for authenticated user');
        passed++;
      } else {
        logFail('Drama details watchlist status check failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('8. Toggle Save Drama (- Remove from Watchlist)');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req('POST', `/user/saved-series/${drama._id}`, null, userToken);
      if (
        res.status === 200 &&
        res.data.success === true &&
        res.data.data.isSaved === false &&
        res.data.data.action === 'REMOVED' &&
        res.data.data.totalSaved === 0
      ) {
        logPass('POST /user/saved-series/:dramaId toggles drama off (-)');
        passed++;
      } else {
        logFail('Toggle remove drama failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('9. User Library Profile Overview');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req('GET', '/user/profile', null, userToken);
      if (
        res.status === 200 &&
        res.data.data?.library &&
        typeof res.data.data.library.savedSeriesCount === 'number' &&
        typeof res.data.data.library.watchHistoryCount === 'number'
      ) {
        logPass('GET /user/profile returns user details and library counts');
        passed++;
      } else {
        logFail('User library overview failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('10. Convenience Route /dramas/:dramaId/save');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req('POST', `/dramas/${drama.slug}/save`, null, userToken);
      if (res.status === 201 && res.data.data.isSaved === true) {
        logPass('POST /dramas/:dramaSlug/save successfully toggles by drama slug');
        passed++;
      } else {
        logFail('Convenience drama save route failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('11. Explicit DELETE /user/saved-series/:dramaId');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req('DELETE', `/user/saved-series/${drama._id}`, null, userToken);
      if (res.status === 200 && res.data.data.isSaved === false) {
        logPass('DELETE /user/saved-series/:dramaId successfully removes saved series');
        passed++;
      } else {
        logFail('Explicit delete saved series failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('12. User Settings Update');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req(
        'PUT',
        '/user/settings',
        {
          autoplayNext: false,
          videoQuality: '1080p',
          subtitlesLanguage: 'English'
        },
        userToken
      );
      if (
        res.status === 200 &&
        res.data.data?.settings?.videoQuality === '1080p' &&
        res.data.data?.settings?.autoplayNext === false
      ) {
        logPass('PUT /user/settings successfully updates playback and app preferences');
        passed++;
      } else {
        logFail('User settings update failed', JSON.stringify(res.data));
        failed++;
      }
    }

    console.log(`\n${colors.bold}SUMMARY:${colors.reset} Passed: ${passed}, Failed: ${failed}`);
  } catch (error) {
    console.error('Test suite encountered an error:', error);
    failed++;
  } finally {
    if (server) server.close();
    if (mongoose.connection) await mongoose.connection.close();
    if (mongod) await mongod.stop();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
