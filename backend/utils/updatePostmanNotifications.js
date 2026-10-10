import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const postmanPath = path.resolve(__dirname, '../../E2_Stories_OTT_Auth_APIs.postman_collection.json');

const col = JSON.parse(fs.readFileSync(postmanPath, 'utf8'));
const mobileFolder = col.item.find(i => i.name === 'MOBILE APP');
const authFolder = mobileFolder?.item.find(i => i.name.includes('Authentication'));
const notifFolder = mobileFolder?.item.find(i => i.name.includes('Notifications'));

const verifyOtp = authFolder?.item.find(i => i.name.includes('Verify OTP'));
if (verifyOtp) {
  verifyOtp.request.body.raw = JSON.stringify({
    phoneNumber: '{{phoneNumber}}',
    countryCode: '{{countryCode}}',
    otp: '{{otp}}',
    fcmToken: 'OPTIONAL_FCM_DEVICE_TOKEN'
  }, null, 2);
  verifyOtp.request.description += '\n- `fcmToken` (optional) — immediately saves device push token on successful login';
}

const regDev = notifFolder?.item.find(i => i.name.includes('Register Device Token'));
if (regDev) {
  regDev.request.description = 'Save device FCM push notification token.\n\nCall on app startup or when OS issues a new token. Supports optional Bearer token (attaches to authenticated user, or registers guest device). Accepts `fcmToken`, `deviceToken`, or `token`.';
}

const unregDev = notifFolder?.item.find(i => i.name.includes('Unregister Device Token'));
if (unregDev) {
  unregDev.request.description = 'Unregister device FCM push token on user logout.\n\nAccepts `fcmToken`, `deviceToken`, or `token`.';
}

const getNotifs = notifFolder?.item.find(i => i.name.includes('Get Notifications'));
if (getNotifs) {
  getNotifs.request.description = 'Fetch paginated notification list.\n\nReturns both `notifications: [...]` (flat list) and `groups: [...]` (date-grouped sections Today, Yesterday, X Days Ago) for complete mobile app compatibility.';
}

fs.writeFileSync(postmanPath, JSON.stringify(col, null, 2));
console.log('✅ Postman collection updated successfully with notification improvements.');
