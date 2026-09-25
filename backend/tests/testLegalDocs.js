/**
 * Automated Verification Test for E² Stories OTT Legal Documents APIs
 * Tests Mobile App endpoints (Privacy Policy, Terms & Conditions, Grievance Compliance)
 * and Admin Panel endpoints.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { LegalDoc } from '../models/LegalDoc.js';
import { seedDefaultLegalDocs } from '../config/seedLegalDocs.js';

let server;
let mongod;
const PORT = 5098;
const BASE_URL = `http://localhost:${PORT}/api/v1/legal`;

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

async function req(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  try {
    const { env } = await import('../config/env.js');
    if (env.MONGODB_URI && env.MONGODB_URI.includes('mongodb')) {
      await mongoose.connect(env.MONGODB_URI);
    } else {
      mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
    }

    server = app.listen(PORT);
    console.log(`Test server running at http://localhost:${PORT}`);

    // Ensure default legal docs are seeded
    await seedDefaultLegalDocs();

    // ── Test 1: GET /api/v1/legal (Public list) ───────────────────────────────
    logSection('1. Public Legal Documents List');
    try {
      const res = await req('GET', '/');
      if (res.status === 200 && res.data.success && res.data.data.documents.length >= 4) {
        logPass('GET /api/v1/legal returns active documents list with bySlug map');
        passed++;
      } else {
        throw new Error(`Unexpected response: ${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      logFail('GET /api/v1/legal', err.message);
      failed++;
    }

    // ── Test 2: GET /api/v1/legal/privacy-policy (Mobile Profile item) ─────────
    logSection('2. Mobile App: Privacy Policy');
    try {
      const res = await req('GET', '/privacy-policy');
      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.slug === 'privacy-policy' &&
        res.data.data.content.includes('PRIVACY POLICY')
      ) {
        logPass('GET /api/v1/legal/privacy-policy returns complete Privacy Policy document');
        passed++;
      } else {
        throw new Error(`Privacy policy fetch failed: ${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      logFail('GET /api/v1/legal/privacy-policy', err.message);
      failed++;
    }

    // ── Test 3: Alias mapping: GET /api/v1/legal/privacy ──────────────────────
    logSection('3. Slug Alias Normalization');
    try {
      const res = await req('GET', '/privacy');
      if (res.status === 200 && res.data.data.slug === 'privacy-policy') {
        logPass("Alias 'privacy' correctly resolves to 'privacy-policy'");
        passed++;
      } else {
        throw new Error(`Alias normalization failed: ${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      logFail('GET /api/v1/legal/privacy alias', err.message);
      failed++;
    }

    // ── Test 4: GET /api/v1/legal/terms-and-conditions (Mobile Profile item) ──
    logSection('4. Mobile App: Terms & Conditions');
    try {
      const res = await req('GET', '/terms-and-conditions');
      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.slug === 'terms-and-conditions' &&
        res.data.data.content.includes('TERMS OF SERVICE')
      ) {
        logPass('GET /api/v1/legal/terms-and-conditions returns complete Terms of Service document');
        passed++;
      } else {
        throw new Error(`Terms fetch failed: ${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      logFail('GET /api/v1/legal/terms-and-conditions', err.message);
      failed++;
    }

    // ── Test 5: Alias mapping: GET /api/v1/legal/terms ────────────────────────
    try {
      const res = await req('GET', '/terms');
      if (res.status === 200 && res.data.data.slug === 'terms-and-conditions') {
        logPass("Alias 'terms' correctly resolves to 'terms-and-conditions'");
        passed++;
      } else {
        throw new Error(`Alias normalization failed: ${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      logFail('GET /api/v1/legal/terms alias', err.message);
      failed++;
    }

    // ── Test 6: GET /api/v1/legal/compliance/grievance (Rule 11 Compliance) ───
    logSection('5. Statutory Grievance Redressal (Rule 11)');
    try {
      const res = await req('GET', '/compliance/grievance');
      if (
        res.status === 200 &&
        res.data.success &&
        res.data.data.officer &&
        Boolean(res.data.data.officer.officerName) &&
        Boolean(res.data.data.officer.email)
      ) {
        logPass(`GET /api/v1/legal/compliance/grievance returns officer (${res.data.data.officer.officerName}) & details`);
        passed++;
      } else {
        throw new Error(`Grievance fetch failed: ${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      logFail('GET /api/v1/legal/compliance/grievance', err.message);
      failed++;
    }

    // ── Test 7: GET /api/v1/legal/admin/all (Admin Panel view) ────────────────
    logSection('6. Admin Panel Legal Operations');
    try {
      const res = await req('GET', '/admin/all');
      if (res.status === 200 && res.data.data.documents.length >= 4 && res.data.data.bySlug) {
        logPass('GET /api/v1/legal/admin/all returns all documents with bySlug dictionary');
        passed++;
      } else {
        throw new Error(`Admin fetch failed: ${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      logFail('GET /api/v1/legal/admin/all', err.message);
      failed++;
    }

    // ── Test 8: PUT /api/v1/legal/admin/privacy-policy (Update Doc) ───────────
    try {
      const updatedContent = 'UPDATED PRIVACY POLICY — E² Stories Test';
      const res = await req('PUT', '/admin/privacy-policy', {
        title: 'Privacy Policy',
        content: updatedContent
      });
      if (res.status === 200 && res.data.data.content === updatedContent) {
        logPass('PUT /api/v1/legal/admin/privacy-policy successfully updates content in DB');
        passed++;
      } else {
        throw new Error(`Update doc failed: ${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      logFail('PUT /api/v1/legal/admin/privacy-policy', err.message);
      failed++;
    }

    // ── Test 9: PUT /api/v1/legal/admin/compliance (Update Officer) ───────────
    try {
      const res = await req('PUT', '/admin/compliance', {
        name: 'Vikram Malhotra',
        email: 'vikram.grievance@e2stories.in',
        sla: '7 Days Expedited SLA'
      });
      if (
        res.status === 200 &&
        res.data.data.metadata.officerName === 'Vikram Malhotra' &&
        res.data.data.metadata.sla === '7 Days Expedited SLA'
      ) {
        logPass('PUT /api/v1/legal/admin/compliance successfully updates grievance officer details');
        passed++;
      } else {
        throw new Error(`Update compliance failed: ${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      logFail('PUT /api/v1/legal/admin/compliance', err.message);
      failed++;
    }

    // ── Test 10: 404 on non-existent document ─────────────────────────────────
    logSection('7. Error Handling (404 Not Found)');
    try {
      const res = await req('GET', '/non-existent-doc-xyz');
      if (res.status === 404 && res.data.success === false && res.data.error === 'LEGAL_DOC_NOT_FOUND') {
        logPass('GET /api/v1/legal/non-existent-doc returns 404 with LEGAL_DOC_NOT_FOUND error code');
        passed++;
      } else {
        throw new Error(`Expected 404 but got ${res.status}: ${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      logFail('GET /api/v1/legal/non-existent-doc 404 check', err.message);
      failed++;
    }

    console.log(`\n==========================================`);
    console.log(`Legal Docs API Tests Summary:`);
    console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
    console.log(`  Failed: ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`);
    console.log(`==========================================\n`);
  } catch (fatal) {
    console.error('Fatal test runner error:', fatal);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
