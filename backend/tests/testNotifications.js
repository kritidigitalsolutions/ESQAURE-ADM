/**
 * E² Stories OTT — Notification API Integration Test
 * Run: node tests/testNotifications.js
 *
 * Tests (in order):
 *  0. Health check
 *  1. OTP + Login (to get authToken & userId)
 *  2. Register Device Token (FCM)
 *  3. Get Notification Settings
 *  4. Update Notification Settings (toggle recommendations on)
 *  5. Send Notification (NEW_EPISODE)
 *  6. Send Notification (NEW_RELEASE)
 *  7. Send Notification (RECOMMENDATION) — user just turned it on
 *  8. Get Unread Count
 *  9. Get Notifications List (grouped)
 * 10. Mark Single as Read
 * 11. Mark All as Read
 * 12. Delete Single Notification
 * 13. Clear All Notifications
 * 14. Unregister Device Token
 */

const BASE_URL = 'http://localhost:5001/api/v1';

// ── Minimal HTTP helper (no external deps) ───────────────────────────────────
async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const json = await res.json();
  return { status: res.status, ...json };
}

// ── Console helpers ───────────────────────────────────────────────────────────
const pass = (label) => console.log(`  ✓ ${label}`);
const fail = (label, detail) => console.error(`  ✗ ${label}`, detail ?? '');
let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) { pass(label); passed++; }
  else { fail(label, detail); failed++; }
}

// ── Tests ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n══════════════════════════════════════════');
  console.log('  E² Stories — Notification API Tests');
  console.log('══════════════════════════════════════════\n');

  // ── 0. Health ──────────────────────────────────────────────────────────────
  console.log('[ 0 ] Health Check');
  try {
    const r = await fetch(`${BASE_URL}/health`).then(x => x.json());
    check('Server is healthy', r.status === 'ok', r);
  } catch (e) {
    fail('Server unreachable — is the backend running?', e.message);
    process.exit(1);
  }

  // ── 1. Auth — OTP login ────────────────────────────────────────────────────
  console.log('\n[ 1 ] OTP Login');
  const PHONE = process.env.TEST_PHONE || '7600000097';
  const CC    = '+91';

  const otpRes = await req('POST', '/auth/request-otp', { phoneNumber: PHONE, countryCode: CC });
  check('OTP sent', otpRes.success, otpRes.message);

  const otp = otpRes.data?.devOtp;
  check('devOtp present in response', !!otp, 'devOtp missing — is NODE_ENV=development?');

  const verRes = await req('POST', '/auth/verify-otp', { phoneNumber: PHONE, countryCode: CC, otp });
  check('OTP verified / logged in', verRes.success, verRes.message);

  const authToken = verRes.data?.token;
  const userId    = verRes.data?.user?.id;
  check('authToken received', !!authToken);
  check('userId received', !!userId);

  // ── 2. Register Device Token ───────────────────────────────────────────────
  console.log('\n[ 2 ] Register Device Token (FCM)');
  const fakeToken = `test-fcm-token-${Date.now()}`;
  const regRes = await req('POST', '/notifications/register-device', { fcmToken: fakeToken }, authToken);
  check('Device token registered', regRes.success, regRes.message);

  // Idempotency: second registration should not duplicate
  const regRes2 = await req('POST', '/notifications/register-device', { fcmToken: fakeToken }, authToken);
  check('Second registration is idempotent', regRes2.success, regRes2.message);

  // ── 3. Get Notification Settings ──────────────────────────────────────────
  console.log('\n[ 3 ] Get Notification Settings');
  const settingsRes = await req('GET', '/notifications/settings', null, authToken);
  check('Settings fetched', settingsRes.success, settingsRes.message);
  check('Has newEpisodes toggle',    typeof settingsRes.data?.settings?.newEpisodes === 'boolean');
  check('Has newReleases toggle',    typeof settingsRes.data?.settings?.newReleases === 'boolean');
  check('Has recommendations toggle',typeof settingsRes.data?.settings?.recommendations === 'boolean');
  console.log('     →', JSON.stringify(settingsRes.data?.settings));

  // ── 4. Update Notification Settings ───────────────────────────────────────
  console.log('\n[ 4 ] Update Notification Settings');
  const updateRes = await req('PUT', '/notifications/settings', {
    newEpisodes: true,
    newReleases: true,
    recommendations: true  // turn on so recommendation notifications work
  }, authToken);
  check('Settings updated', updateRes.success, updateRes.message);
  check('recommendations is now true', updateRes.data?.settings?.recommendations === true);

  // ── 5. Send NEW_EPISODE notification ──────────────────────────────────────
  console.log('\n[ 5 ] Send NEW_EPISODE Notification');
  const send1 = await req('POST', '/notifications/send', {
    userId,
    type: 'NEW_EPISODE',
    title: 'New Episode Available',
    body: 'Episode 09 of The Last Promise is now available.',
    imageUrl: 'https://picsum.photos/200/120',
    deepLink: '/content/the-last-promise?episode=9'
  }, authToken);
  check('NEW_EPISODE notification created', send1.success, send1.message);
  check('delivered flag is true', send1.data?.delivered === true);
  const notif1Id = send1.data?.notification?.id;
  check('Notification ID returned', !!notif1Id);

  // ── 6. Send NEW_RELEASE notification ──────────────────────────────────────
  console.log('\n[ 6 ] Send NEW_RELEASE Notification');
  const send2 = await req('POST', '/notifications/send', {
    userId,
    type: 'NEW_RELEASE',
    title: 'New Release',
    body: 'A new drama has arrived. Discover Dangerous Love.',
    imageUrl: 'https://picsum.photos/200/120'
  }, authToken);
  check('NEW_RELEASE notification created', send2.success, send2.message);
  const notif2Id = send2.data?.notification?.id;
  check('Notification ID returned', !!notif2Id);

  // ── 7. Send RECOMMENDATION notification ───────────────────────────────────
  console.log('\n[ 7 ] Send RECOMMENDATION Notification');
  const send3 = await req('POST', '/notifications/send', {
    userId,
    type: 'RECOMMENDATION',
    title: 'Recommended For You',
    body: 'Based on your watch history, you might enjoy "Midnight Billionaire".'
  }, authToken);
  check('RECOMMENDATION notification created (user opted in)', send3.success, send3.message);

  // ── 8. Unread Count ────────────────────────────────────────────────────────
  console.log('\n[ 8 ] Unread Count');
  const countRes = await req('GET', '/notifications/unread-count', null, authToken);
  check('Unread count fetched', countRes.success, countRes.message);
  check('unreadCount >= 3', countRes.data?.unreadCount >= 3,
    `Got: ${countRes.data?.unreadCount}`);
  console.log(`     → unreadCount = ${countRes.data?.unreadCount}`);

  // ── 9. Get Notifications List (grouped) ───────────────────────────────────
  console.log('\n[ 9 ] Get Notifications (List)');
  const listRes = await req('GET', '/notifications?page=0&limit=10', null, authToken);
  check('Notifications listed', listRes.success, listRes.message);
  check('groups array present', Array.isArray(listRes.data?.groups));
  check('First group has label', typeof listRes.data?.groups?.[0]?.label === 'string');
  check('First group has notifications', Array.isArray(listRes.data?.groups?.[0]?.notifications));
  check('Notifications have timeAgo', !!listRes.data?.groups?.[0]?.notifications?.[0]?.timeAgo);
  check('pagination object present', !!listRes.data?.pagination);
  check('pagination.page is 0', listRes.data?.pagination?.page === 0);
  console.log(`     → Groups: ${listRes.data?.groups?.map(g => g.label).join(', ')}`);

  // ── 10. Mark Single as Read ────────────────────────────────────────────────
  console.log('\n[ 10 ] Mark Single Notification as Read');
  if (notif1Id) {
    const readRes = await req('PATCH', `/notifications/${notif1Id}/read`, null, authToken);
    check('Single notification marked as read', readRes.success, readRes.message);
    check('isRead is true in response', readRes.data?.notification?.isRead === true);
  } else {
    fail('Skipped — notif1Id not available');
    failed++;
  }

  // ── 11. Mark All as Read ───────────────────────────────────────────────────
  console.log('\n[ 11 ] Mark All Notifications as Read');
  const readAllRes = await req('PATCH', '/notifications/read-all', null, authToken);
  check('All marked as read', readAllRes.success, readAllRes.message);
  check('updatedCount is number', typeof readAllRes.data?.updatedCount === 'number',
    readAllRes.data?.updatedCount);

  const countAfter = await req('GET', '/notifications/unread-count', null, authToken);
  check('Unread count is now 0', countAfter.data?.unreadCount === 0,
    `Still: ${countAfter.data?.unreadCount}`);

  // ── 12. Delete Single Notification ────────────────────────────────────────
  console.log('\n[ 12 ] Delete Single Notification');
  if (notif2Id) {
    const delRes = await req('DELETE', `/notifications/${notif2Id}`, null, authToken);
    check('Single notification deleted', delRes.success, delRes.message);

    // Verify deletion
    const list2 = await req('GET', '/notifications?limit=50', null, authToken);
    const allIds = list2.data?.groups?.flatMap(g => g.notifications.map(n => n.id)) || [];
    check('Deleted notification no longer in list', !allIds.includes(notif2Id));
  } else {
    fail('Skipped — notif2Id not available');
    failed++;
  }

  // ── 13. Clear All Notifications ───────────────────────────────────────────
  console.log('\n[ 13 ] Clear All Notifications');
  const clearRes = await req('DELETE', '/notifications/clear-all', null, authToken);
  check('All notifications cleared', clearRes.success, clearRes.message);
  check('deletedCount is number', typeof clearRes.data?.deletedCount === 'number');

  const listAfterClear = await req('GET', '/notifications?limit=50', null, authToken);
  const totalAfterClear = listAfterClear.data?.pagination?.total ?? 0;
  check('Notification list is empty after clear', totalAfterClear === 0,
    `Still has: ${totalAfterClear}`);

  // ── 14. Unregister Device Token ───────────────────────────────────────────
  console.log('\n[ 14 ] Unregister Device Token');
  const unregRes = await req('DELETE', '/notifications/unregister-device',
    { fcmToken: fakeToken }, authToken);
  check('Device token unregistered', unregRes.success, unregRes.message);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log(`  Results: ${passed} passed  |  ${failed} failed`);
  console.log('══════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('\n[FATAL] Unhandled error in test runner:', err.message);
  process.exit(1);
});
