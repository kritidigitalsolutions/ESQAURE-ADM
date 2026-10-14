/**
 * Integration Test for Mobile App "Notification Settings" Screen
 * Matches the mobile alert preferences screen:
 * - Title: Notification Settings
 * - Subtitle: Manage your alert preferences
 * - Category: ALERTS
 *   - New episodes: Get notified when a series continues
 *   - New releases: Discover newly added series
 *   - Recommendations: Personalized stories for you
 *
 * Run: node tests/testNotificationSettingsScreen.js
 */

const BASE_URL = 'http://localhost:5001/api/v1';

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

const pass = (label) => console.log(`  ✓ ${label}`);
const fail = (label, detail) => console.error(`  ✗ ${label}`, detail ?? '');
let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    pass(label);
    passed++;
  } else {
    fail(label, detail);
    failed++;
  }
}

async function run() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  E² Stories — Notification Settings Screen API Tests');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Auth Setup
  console.log('[ 1 ] Authenticate Mobile User');
  const testPhone = '7600000097';
  const otpRes = await req('POST', '/auth/request-otp', { phoneNumber: testPhone, countryCode: '+91' });
  const devOtp = otpRes.data?.devOtp;
  const loginRes = await req('POST', '/auth/verify-otp', {
    phoneNumber: testPhone,
    countryCode: '+91',
    otp: devOtp
  });
  const authToken = loginRes.data?.token;
  const userId = loginRes.data?.user?.id;
  check('User logged in successfully', !!authToken);

  // 2. GET /notifications/settings
  console.log('\n[ 2 ] GET /notifications/settings (Screen Metadata & Alerts)');
  const getRes = await req('GET', '/notifications/settings', null, authToken);
  check('Status is 200', getRes.status === 200);
  check('Success is true', getRes.success === true);
  check('Returns title "Notification Settings"', getRes.data?.title === 'Notification Settings');
  check('Returns subtitle "Manage your alert preferences"', getRes.data?.subtitle === 'Manage your alert preferences');
  check('Returns category "ALERTS"', getRes.data?.category === 'ALERTS');
  check('Settings has newEpisodes', typeof getRes.data?.settings?.newEpisodes === 'boolean');
  check('Settings has newReleases', typeof getRes.data?.settings?.newReleases === 'boolean');
  check('Settings has recommendations', typeof getRes.data?.settings?.recommendations === 'boolean');
  
  const alerts = getRes.data?.alerts || [];
  check('Alerts array has 3 items', alerts.length === 3);
  check('Alert 1 is "New episodes"', alerts[0]?.title === 'New episodes' && alerts[0]?.key === 'newEpisodes');
  check('Alert 1 description matches screen', alerts[0]?.description === 'Get notified when a series continues');
  check('Alert 2 is "New releases"', alerts[1]?.title === 'New releases' && alerts[1]?.key === 'newReleases');
  check('Alert 2 description matches screen', alerts[1]?.description === 'Discover newly added series');
  check('Alert 3 is "Recommendations"', alerts[2]?.title === 'Recommendations' && alerts[2]?.key === 'recommendations');
  check('Alert 3 description matches screen', alerts[2]?.description === 'Personalized stories for you');

  // 3. PUT /notifications/settings (Batch Update)
  console.log('\n[ 3 ] PUT /notifications/settings (Batch Update)');
  const putRes = await req(
    'PUT',
    '/notifications/settings',
    {
      newEpisodes: true,
      newReleases: false,
      recommendations: true
    },
    authToken
  );
  check('PUT returns 200', putRes.status === 200);
  check('newReleases is false', putRes.data?.settings?.newReleases === false);
  check('recommendations is true', putRes.data?.settings?.recommendations === true);
  check('alerts array updated in response', putRes.data?.alerts?.find(a => a.key === 'newReleases')?.enabled === false);

  // 4. PATCH /notifications/settings (Partial & Key-Value Update)
  console.log('\n[ 4 ] PATCH /notifications/settings (Key-Value)');
  const patchRes = await req(
    'PATCH',
    '/notifications/settings',
    {
      key: 'newReleases',
      enabled: true
    },
    authToken
  );
  check('PATCH returns 200', patchRes.status === 200);
  check('newReleases is restored to true', patchRes.data?.settings?.newReleases === true);

  // 5. PATCH /notifications/settings/:key/toggle (URL param toggle)
  console.log('\n[ 5 ] PATCH /notifications/settings/:key/toggle');
  const toggleRes = await req('PATCH', '/notifications/settings/recommendations/toggle', null, authToken);
  check('Toggle recommendations returns 200', toggleRes.status === 200);
  check('recommendations is now flipped to false', toggleRes.data?.settings?.recommendations === false);

  // 6. POST /notifications/settings/toggle (Body toggle)
  console.log('\n[ 6 ] POST /notifications/settings/toggle');
  const bodyToggleRes = await req(
    'POST',
    '/notifications/settings/toggle',
    { key: 'newEpisodes', enabled: false },
    authToken
  );
  check('POST toggle returns 200', bodyToggleRes.status === 200);
  check('newEpisodes is now false', bodyToggleRes.data?.settings?.newEpisodes === false);

  // 7. POST /notifications/settings/reset
  console.log('\n[ 7 ] POST /notifications/settings/reset (Factory Defaults)');
  const resetRes = await req('POST', '/notifications/settings/reset', null, authToken);
  check('Reset returns 200', resetRes.status === 200);
  check('newEpisodes is true (default)', resetRes.data?.settings?.newEpisodes === true);
  check('newReleases is true (default)', resetRes.data?.settings?.newReleases === true);
  check('recommendations is false (default)', resetRes.data?.settings?.recommendations === false);

  // 8. User Library aliases: GET /user/notification-settings & GET /user/settings
  console.log('\n[ 8 ] GET /user/notification-settings & GET /user/settings (Library Aliases)');
  const userNotifRes = await req('GET', '/user/notification-settings', null, authToken);
  check('/user/notification-settings alias returns 200', userNotifRes.status === 200);
  check('Alias has alerts array', Array.isArray(userNotifRes.data?.alerts));

  const userSettingsRes = await req('GET', '/user/settings', null, authToken);
  check('GET /user/settings returns 200', userSettingsRes.status === 200);
  check('Contains notifications in user settings', typeof userSettingsRes.data?.settings?.notifications?.newEpisodes === 'boolean');

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed  |  ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
