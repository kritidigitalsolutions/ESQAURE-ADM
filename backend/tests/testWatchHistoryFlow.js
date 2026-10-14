/**
 * Comprehensive Automated Verification Test for E² Stories OTT Watch History APIs
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Drama } from '../models/Drama.js';
import { Episode } from '../models/Episode.js';
import { WatchHistory } from '../models/WatchHistory.js';
import { signJwt } from '../utils/jwt.js';

const PORT = process.env.PORT || 5001;
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
  let testUser = null;

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not found in .env');
    await mongoose.connect(mongoUri);

    const drama = await Drama.findOne({ status: 'PUBLISHED' }) || await Drama.findOne();
    if (!drama) throw new Error('No drama found in database for test');

    // Create a temporary isolated test user
    const testPhone = `999${Date.now().toString().slice(-7)}`;
    testUser = await User.create({
      phoneNumber: testPhone,
      countryCode: '+91',
      fullName: 'OTT History Verification Tester',
      isPhoneVerified: true
    });

    const userToken = signJwt({
      userId: testUser._id.toString(),
      phoneNumber: testUser.phoneNumber,
      role: 'USER'
    });

    console.log(`Connected to test database. Testing against server at ${BASE_URL}`);

    // ─────────────────────────────────────────────────────────────────────────
    logSection('1. Initial Empty Watch History');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req('GET', '/watch-history', null, userToken);
      if (
        res.status === 200 &&
        res.data.success === true &&
        Array.isArray(res.data.data.history) &&
        res.data.data.history.length === 0 &&
        res.data.data.summary.totalDramasWatched === 0
      ) {
        logPass('GET /watch-history returns empty list and summary stats when user has no viewing activity');
        passed++;
      } else {
        logFail('Empty watch history failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('2. Record Watch History Progress (Episode 1 - In Progress)');
    // ─────────────────────────────────────────────────────────────────────────
    let episode1 = await Episode.findOne({ dramaId: drama._id, episodeNumber: 1 });
    if (!episode1) {
      episode1 = await Episode.create({
        dramaId: drama._id,
        episodeNumber: 1,
        title: 'Episode 1: The Beginning',
        durationSeconds: 120,
        videoStreamUrl: 'https://cdn.example.com/stream/ep1.m3u8',
        isFree: true
      });
    }

    {
      const body = {
        dramaId: drama._id.toString(),
        episodeNumber: 1,
        watchedSeconds: 60,
        durationSeconds: 120
      };
      const res = await req('POST', '/watch-history', body, userToken);
      if (
        res.status === 201 &&
        res.data.success === true &&
        res.data.data.playback.watchedSeconds === 60 &&
        res.data.data.playback.progressPercentage === 50 &&
        res.data.data.playback.isCompleted === false &&
        res.data.data.playback.status === 'IN_PROGRESS' &&
        res.data.data.actions.resumeUrl.includes('resume=60')
      ) {
        logPass('POST /watch-history records episode 1 playback progress (50% in progress)');
        passed++;
      } else {
        logFail('POST /watch-history failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('3. Record Watch History on Episode 2 of Same Drama (Accumulates History)');
    // ─────────────────────────────────────────────────────────────────────────
    let episode2 = await Episode.findOne({ dramaId: drama._id, episodeNumber: 2 });
    if (!episode2) {
      episode2 = await Episode.create({
        dramaId: drama._id,
        episodeNumber: 2,
        title: 'Episode 2: The Revelation',
        durationSeconds: 150,
        videoStreamUrl: 'https://cdn.example.com/stream/ep2.m3u8',
        isFree: true
      });
    }

    {
      const body = {
        dramaId: drama._id.toString(),
        episodeNumber: 2,
        watchedSeconds: 140,
        durationSeconds: 150
      };
      const res = await req('POST', '/watch-history', body, userToken);
      if (
        res.status === 201 &&
        res.data.success === true &&
        res.data.data.episode.episodeNumber === 2 &&
        res.data.data.seriesProgress.watchedEpisodesCount === 2 &&
        res.data.data.seriesProgress.watchedEpisodes.length === 2
      ) {
        logPass('POST /watch-history maintains drama watchedEpisodes list across episodes (Ep 1 + Ep 2)');
        passed++;
      } else {
        logFail('Multi-episode history accumulation failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('4. GET /watch-history with Rich Metadata, Relative Time & Summary');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req('GET', '/watch-history', null, userToken);
      const item = res.data.data?.history?.[0];
      if (
        res.status === 200 &&
        res.data.success === true &&
        res.data.data.history.length === 1 &&
        res.data.data.summary.totalDramasWatched === 1 &&
        res.data.data.summary.totalEpisodesWatched === 2 &&
        item.drama.title === drama.title &&
        item.episode.episodeNumber === 2 &&
        item.timeline.relativeTime !== '' &&
        item.timeline.dateGroup === 'Today' &&
        item.playback.remainingSeconds > 0
      ) {
        logPass('GET /watch-history returns OTT-formatted card with relative time, dateGroup & summary stats');
        passed++;
      } else {
        logFail('GET /watch-history verification failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('5. Itemized Episodes View (view=episodes)');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req('GET', '/watch-history?view=episodes', null, userToken);
      if (
        res.status === 200 &&
        res.data.success === true &&
        res.data.data.history.length === 2 &&
        res.data.data.history[0].episodeNumber === 2 &&
        res.data.data.history[1].episodeNumber === 1
      ) {
        logPass('GET /watch-history?view=episodes flattens viewing history to show every individual watched episode');
        passed++;
      } else {
        logFail('view=episodes failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('6. Date Grouped View (groupBy=date)');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req('GET', '/watch-history?groupBy=date', null, userToken);
      if (
        res.status === 200 &&
        res.data.data.groupedHistory &&
        Array.isArray(res.data.data.groupedHistory.Today) &&
        res.data.data.groupedHistory.Today.length === 1
      ) {
        logPass('GET /watch-history?groupBy=date groups items into Today / Yesterday / This Week buckets');
        passed++;
      } else {
        logFail('groupBy=date failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('7. Search Filter in Watch History (search=...)');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const queryWord = drama.title.slice(0, 4);
      const res = await req('GET', `/watch-history?search=${encodeURIComponent(queryWord)}`, null, userToken);
      const emptyRes = await req('GET', '/watch-history?search=NonExistentTitleXYZ12345', null, userToken);
      if (
        res.status === 200 &&
        res.data.data.history.length === 1 &&
        emptyRes.status === 200 &&
        emptyRes.data.data.history.length === 0
      ) {
        logPass('GET /watch-history?search= correctly filters user history by drama title');
        passed++;
      } else {
        logFail('Search filtering in watch history failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('8. Watch History Summary Endpoint (/watch-history/summary)');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req('GET', '/watch-history/summary', null, userToken);
      if (
        res.status === 200 &&
        res.data.success === true &&
        res.data.data.totalDramasWatched === 1 &&
        res.data.data.totalEpisodesWatched === 2 &&
        res.data.data.totalWatchTimeSeconds > 0 &&
        typeof res.data.data.formattedTotalWatchTime === 'string' &&
        res.data.data.recentlyWatched?.title === drama.title
      ) {
        logPass('GET /watch-history/summary returns cumulative analytics, watch time, and recently watched card');
        passed++;
      } else {
        logFail('GET /watch-history/summary failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('9. Drama-Specific Watch History (/watch-history/drama/:dramaId)');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req('GET', `/watch-history/drama/${drama._id}`, null, userToken);
      if (
        res.status === 200 &&
        res.data.success === true &&
        res.data.data.hasStarted === true &&
        res.data.data.drama.id === drama._id.toString() &&
        res.data.data.seriesProgress.watchedEpisodesCount === 2
      ) {
        logPass('GET /watch-history/drama/:dramaId returns detailed episode-level breakdown for that drama');
        passed++;
      } else {
        logFail('Drama-specific watch history failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('10. Mark Drama or Episode as Completed (/mark-completed)');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const res = await req('POST', '/watch-history/mark-completed', { dramaId: drama._id.toString() }, userToken);
      const verifyRes = await req('GET', '/watch-history?status=completed', null, userToken);
      if (
        res.status === 200 &&
        res.data.data.isCompleted === true &&
        verifyRes.status === 200 &&
        verifyRes.data.data.history.length === 1 &&
        verifyRes.data.data.history[0].playback.isCompleted === true
      ) {
        logPass('POST /watch-history/mark-completed marks drama as completed and status=completed filter works');
        passed++;
      } else {
        logFail('Mark completed failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('11. Remove Single Drama/Item from Watch History');
    // ─────────────────────────────────────────────────────────────────────────
    {
      const historyRecord = await WatchHistory.findOne({ userId: testUser._id, dramaId: drama._id });
      const res = await req('DELETE', `/watch-history/${historyRecord._id}`, null, userToken);
      const afterRes = await req('GET', '/watch-history', null, userToken);
      if (
        res.status === 200 &&
        res.data.data.deleted === true &&
        afterRes.data.data.history.length === 0
      ) {
        logPass('DELETE /watch-history/:historyId successfully removes item from watch history');
        passed++;
      } else {
        logFail('Delete single history item failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    logSection('12. User Alias Compatibility (/user/watch-history)');
    // ─────────────────────────────────────────────────────────────────────────
    {
      // Add a fresh record via /user/watch-history
      await req('POST', '/user/watch-history', { dramaId: drama._id.toString(), episodeNumber: 1, watchedSeconds: 30 }, userToken);

      const res = await req('GET', '/user/watch-history', null, userToken);
      const sumRes = await req('GET', '/user/watch-history/summary', null, userToken);
      const clearRes = await req('DELETE', '/user/watch-history', null, userToken);
      const verifyClear = await req('GET', '/user/watch-history', null, userToken);

      if (
        res.status === 200 &&
        res.data.data.history.length === 1 &&
        sumRes.status === 200 &&
        clearRes.status === 200 &&
        clearRes.data.data.cleared === true &&
        verifyClear.data.data.history.length === 0
      ) {
        logPass('All /user/watch-history endpoints (GET, summary, clear DELETE) work identically');
        passed++;
      } else {
        logFail('/user/watch-history alias suite failed', JSON.stringify(verifyClear.data));
        failed++;
      }
    }

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (testUser) {
      await WatchHistory.deleteMany({ userId: testUser._id });
      await User.findByIdAndDelete(testUser._id);
    }
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();

    console.log(`\n========================================`);
    console.log(`Tests Completed: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
