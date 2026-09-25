/**
 * Automated Verification Test for E² Stories OTT Search & Recommendation APIs
 * Tests:
 * 1. GET /api/v1/search/landing (Guest: Popular Searches 01..N, Recommended Dramas, NO recent searches)
 * 2. GET /api/v1/search/landing (Logged-in User with profile build genres: Recommended personalized as per user.interests)
 * 3. GET /api/v1/search/popular (Ranked list with padded ranks "01", "02", viewsFormatted, etc.)
 * 4. GET /api/v1/search/recommended (Personalized as per genre selected by user in profile build)
 * 5. GET /api/v1/search/suggestions?q=Sec (Drama live autocomplete)
 * 6. GET /api/v1/search/suggestions?q=Rom (Genre live autocomplete)
 * 7. GET /api/v1/search?q=Promise (Drama title multi-field search)
 * 8. GET /api/v1/search?q=Thriller (Genre name matched search)
 * 9. GET /api/v1/search (Empty q defaults to Search Landing Screen)
 * 10. Strict verification: NO recent searches exposed in any response
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { User } from '../models/User.js';
import { Drama } from '../models/Drama.js';
import { Genre } from '../models/Genre.js';
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

    server = app.listen(PORT);
    console.log(`Search Test server running at ${BASE_URL}`);

    // 1. Seed base genres and dramas
    await seedDefaultGenres();
    await seedDefaultDramas();

    const romanceGenre = await Genre.findOne({ slug: 'romance' });
    const thrillerGenre = await Genre.findOne({ slug: 'thriller' });
    const mysteryGenre = await Genre.findOne({ slug: 'mystery' });

    // Seed dramas matching mobile screenshots
    await Drama.create([
      {
        title: 'The Last Promise',
        slug: 'the-last-promise',
        synopsis: 'A heart-wrenching story of unfulfilled promises and eternal devotion.',
        posterUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=720&q=80',
        genres: [romanceGenre._id],
        languages: ['Hindi'],
        tags: ['Romance', 'Heartbreak', 'Drama'],
        totalEpisodes: 24,
        viewsCount: 45000,
        rating: 4.9,
        isTrending: true,
        trendingRank: 1,
        status: 'PUBLISHED'
      },
      {
        title: 'Behind Lies',
        slug: 'behind-lies',
        synopsis: 'Dark secrets lurk behind the facade of a wealthy family.',
        posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=720&q=80',
        genres: [thrillerGenre._id, mysteryGenre._id],
        languages: ['Hindi', 'English'],
        tags: ['Thriller', 'Suspense', 'Mystery'],
        totalEpisodes: 18,
        viewsCount: 22000,
        rating: 4.7,
        isTrending: true,
        trendingRank: 2,
        status: 'PUBLISHED'
      },
      {
        title: 'My Wife Rented Me Out',
        slug: 'my-wife-rented-me-out',
        synopsis: 'A hilarious yet poignant comedy drama about unexpected marital contracts.',
        posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=720&q=80',
        genres: [romanceGenre._id],
        languages: ['Hindi'],
        tags: ['Romance', 'Comedy'],
        totalEpisodes: 20,
        viewsCount: 3500,
        rating: 4.8,
        isTrending: false,
        status: 'PUBLISHED'
      },
      {
        title: 'Dhokha - A Dark Side of Love',
        slug: 'dhokha-dark-side-of-love',
        synopsis: 'A chilling romantic thriller exploring betrayal and vengeance.',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=720&q=80',
        genres: [romanceGenre._id, thrillerGenre._id],
        languages: ['Hindi'],
        tags: ['Thriller', 'Romance', 'Betrayal'],
        totalEpisodes: 25,
        viewsCount: 15400,
        rating: 4.85,
        isTrending: true,
        trendingRank: 3,
        status: 'PUBLISHED'
      }
    ]);

    // Create User A with 'Thriller' & 'Mystery' selected during profile build
    const thrillerUser = await User.create({
      phoneNumber: '9998887771',
      countryCode: '+91',
      firstName: 'Karan',
      lastName: 'Kapoor',
      email: 'karan@example.com',
      isProfileCompleted: true,
      interests: [thrillerGenre._id, mysteryGenre._id],
      status: 'ACTIVE'
    });
    const thrillerToken = signJwt({ userId: thrillerUser._id.toString() });

    // Create User B with 'Romance' selected during profile build
    const romanceUser = await User.create({
      phoneNumber: '9998887772',
      countryCode: '+91',
      firstName: 'Simran',
      lastName: 'Kaur',
      email: 'simran@example.com',
      isProfileCompleted: true,
      interests: [romanceGenre._id],
      status: 'ACTIVE'
    });
    const romanceToken = signJwt({ userId: romanceUser._id.toString() });

    // ─────────────────────────────────────────────────────────────────────────
    // Test 1: GET /search/landing as Guest
    // ─────────────────────────────────────────────────────────────────────────
    logSection('1. GET /search/landing as Guest');
    {
      const res = await req('GET', '/search/landing');
      if (
        res.status === 200 &&
        res.data.success &&
        Array.isArray(res.data.data.popularSearches) &&
        res.data.data.popularSearches.length > 0 &&
        Array.isArray(res.data.data.recommendedForYou) &&
        res.data.data.recommendedForYou.length > 0 &&
        res.data.data.isPersonalized === false &&
        res.data.data.recentSearches === undefined
      ) {
        logPass(
          `Guest landing received ${res.data.data.popularSearches.length} popular and ${res.data.data.recommendedForYou.length} recommended dramas (no recent searches)`
        );
        passed++;
      } else {
        logFail('Guest landing failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 2: Popular Searches Rank Badges & Formatting (01, 02, 03...)
    // ─────────────────────────────────────────────────────────────────────────
    logSection('2. GET /search/popular Rank Badges');
    {
      const res = await req('GET', '/search/popular?limit=5');
      const popular = res.data?.data?.popularSearches || [];
      const first = popular[0];
      const second = popular[1];

      if (
        res.status === 200 &&
        popular.length >= 2 &&
        first.rank === '01' &&
        second.rank === '02' &&
        typeof first.viewsFormatted === 'string' &&
        first.title &&
        first.slug
      ) {
        logPass(`Popular searches formatted rank: "${first.rank}" (${first.title}), views: ${first.viewsFormatted}`);
        passed++;
      } else {
        logFail('Popular searches rank test failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 3: Recommendation Personalized by Profile Build Genre (Thriller User)
    // ─────────────────────────────────────────────────────────────────────────
    logSection('3. GET /search/landing Personalized for Thriller Profile User');
    {
      const res = await req('GET', '/search/landing', null, thrillerToken);
      const data = res.data?.data;
      const recommended = data?.recommendedForYou || [];

      // User has Thriller/Mystery genres; top item should match those genres
      const matchesUserGenre = recommended.some((d) =>
        d.genres.includes('Thriller') || d.genres.includes('Mystery')
      );

      if (
        res.status === 200 &&
        data.isPersonalized === true &&
        data.userGenres.some((g) => g.slug === 'thriller') &&
        matchesUserGenre
      ) {
        logPass(
          `Personalized landing for Thriller user: isPersonalized=true, userGenres: [${data.userGenres.map((g) => g.name).join(', ')}]`
        );
        passed++;
      } else {
        logFail('Personalized landing for Thriller user failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 4: Dedicated Recommended Endpoint GET /search/recommended (Romance User)
    // ─────────────────────────────────────────────────────────────────────────
    logSection('4. GET /search/recommended for Romance User');
    {
      const res = await req('GET', '/search/recommended?limit=5', null, romanceToken);
      const data = res.data?.data;
      const recommended = data?.recommendedForYou || [];

      const romanceMatches = recommended.filter((d) => d.genres.includes('Romance'));

      if (
        res.status === 200 &&
        data.isPersonalized === true &&
        romanceMatches.length > 0 &&
        typeof recommended[0].viewsFormatted === 'string'
      ) {
        logPass(
          `Recommended API returned ${romanceMatches.length} romance dramas for Romance user, first view badge: ${recommended[0].viewsFormatted}`
        );
        passed++;
      } else {
        logFail('Recommended API failed for Romance user', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 5: Live Autocomplete Suggestions for Dramas GET /search/suggestions?q=Sec
    // ─────────────────────────────────────────────────────────────────────────
    logSection('5. GET /search/suggestions for Dramas');
    {
      const res = await req('GET', '/search/suggestions?q=Sec');
      const suggestions = res.data?.data?.suggestions || [];
      const hasSecurityGuard = suggestions.some((s) =>
        s.title.toLowerCase().includes('security')
      );

      if (res.status === 200 && hasSecurityGuard) {
        logPass(`Autocomplete "Sec" found: ${suggestions.map((s) => s.title).join(', ')}`);
        passed++;
      } else {
        logFail('Suggestions for drama failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 6: Live Autocomplete Suggestions for Genres GET /search/suggestions?q=Rom
    // ─────────────────────────────────────────────────────────────────────────
    logSection('6. GET /search/suggestions for Genres');
    {
      const res = await req('GET', '/search/suggestions?q=Rom');
      const suggestions = res.data?.data?.suggestions || [];
      const hasRomance = suggestions.some((s) => s.type === 'genre' && s.title === 'Romance');

      if (res.status === 200 && hasRomance) {
        logPass(`Autocomplete "Rom" matched genre: Romance`);
        passed++;
      } else {
        logFail('Suggestions for genre failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 7: Multi-field Search Query GET /search?q=Promise
    // ─────────────────────────────────────────────────────────────────────────
    logSection('7. GET /search?q=Promise (Drama Title Search)');
    {
      const res = await req('GET', '/search?q=Promise');
      const results = res.data?.data?.results || [];

      if (
        res.status === 200 &&
        results.length > 0 &&
        results[0].title === 'The Last Promise' &&
        res.data.data.pagination.total >= 1
      ) {
        logPass(`Search "Promise" matched "${results[0].title}" (total: ${res.data.data.pagination.total})`);
        passed++;
      } else {
        logFail('Search for "Promise" failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 8: Genre-matched Search Query GET /search?q=Thriller
    // ─────────────────────────────────────────────────────────────────────────
    logSection('8. GET /search?q=Thriller (Genre-matched Search)');
    {
      const res = await req('GET', '/search?q=Thriller');
      const results = res.data?.data?.results || [];
      const matchedGenres = res.data?.data?.matchedGenres || [];

      const hasThrillerDrama = results.some((d) => d.genres.includes('Thriller'));

      if (
        res.status === 200 &&
        hasThrillerDrama &&
        matchedGenres.some((g) => g.slug === 'thriller')
      ) {
        logPass(`Search "Thriller" matched genre and returned ${results.length} thriller dramas`);
        passed++;
      } else {
        logFail('Search for "Thriller" failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 9: Empty Query on Unified GET /search falls back to Landing
    // ─────────────────────────────────────────────────────────────────────────
    logSection('9. GET /search without "q" returns landing screen');
    {
      const res = await req('GET', '/search');
      if (
        res.status === 200 &&
        res.data.data.popularSearches &&
        res.data.data.recommendedForYou
      ) {
        logPass('GET /search without query returned landing payload successfully');
        passed++;
      } else {
        logFail('GET /search without query failed', JSON.stringify(res.data));
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 10: Strict Verification - No Recent Search Exposed
    // ─────────────────────────────────────────────────────────────────────────
    logSection('10. Strict Verification: NO recent searches in responses');
    {
      const endpoints = ['/search', '/search/landing', '/search/popular', '/search/recommended'];
      let noRecentSearchesFound = true;

      for (const endpoint of endpoints) {
        const res = await req('GET', endpoint);
        if (
          res.data?.data?.recentSearches !== undefined ||
          res.data?.recentSearches !== undefined
        ) {
          noRecentSearchesFound = false;
          break;
        }
      }

      if (noRecentSearchesFound) {
        logPass('Verified: Strictly NO recent search properties exist in any search API response');
        passed++;
      } else {
        logFail('Recent searches was unexpectedly found in search API response', '');
        failed++;
      }
    }

    console.log(`\n=================================================`);
    console.log(`SEARCH TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
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
