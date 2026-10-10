import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const postmanPath = path.resolve(__dirname, '../../E2_Stories_OTT_Auth_APIs.postman_collection.json');

const raw = fs.readFileSync(postmanPath, 'utf8');
const collection = JSON.parse(raw);

// ─────────────────────────────────────────────────────────────────────────────
// 1. COLLECTION VARIABLES
// ─────────────────────────────────────────────────────────────────────────────
const requiredVars = [
  { key: 'baseUrl', value: 'http://localhost:5001/api/v1', description: 'API base URL' },
  { key: 'rootUrl', value: 'http://localhost:5001', description: 'Server root HTTP address' },
  { key: 'phoneNumber', value: '7600000097', description: 'Test mobile number' },
  { key: 'countryCode', value: '+91', description: 'Country code' },
  { key: 'otp', value: '', description: 'Auto-filled by Request OTP script' },
  { key: 'authToken', value: '', description: 'Auto-filled by Verify OTP script (Mobile JWT)' },
  { key: 'adminToken', value: '', description: 'Auto-filled by Firebase Admin Login script or static admin JWT' },
  { key: 'refreshToken', value: '', description: 'Auto-filled by Verify OTP script' },
  { key: 'firebaseIdToken', value: '', description: 'Firebase Auth ID token for admin verification' },
  { key: 'userId', value: '', description: 'Paste a user _id here for admin user requests' },
  { key: 'planId', value: '', description: 'Auto-saved by Get Plans request or pasted manually' },
  { key: 'newPlanId', value: '', description: 'Target plan ID for upgrade' },
  { key: 'orderId', value: '', description: 'Auto-saved by Initiate Subscription request' },
  { key: 'subscriptionId', value: '', description: 'Subscription document _id for manual admin override actions' },
  { key: 'dramaSlug', value: 'security-guard-ki-ceo-gf', description: 'Default drama slug for video player testing' },
  { key: 'dramaId', value: '', description: 'MongoDB ObjectId or slug of a Drama' },
  { key: 'episodeNumber', value: '2', description: 'Episode number to play' },
  { key: 'searchQuery', value: 'Promise', description: 'Query string for search testing' },
  { key: 'sectionId', value: '', description: 'MongoDB ObjectId of a Home Category Section' },
  { key: 'sectionSlug', value: 'trending-now', description: 'Slug of a Home Category Section' },
  { key: 'genreId', value: '', description: 'MongoDB ObjectId of a Genre category' },
  { key: 'genreSlug', value: 'romance', description: 'Slug of a Genre category' },
  { key: 'bannerId', value: '', description: 'MongoDB ObjectId of a Banner' },
  { key: 'customAdId', value: '6ac77e265dd8236bc5e8c4f1', description: 'MongoDB ObjectId of a Custom Ad campaign' },
  { key: 'promoId', value: '', description: 'MongoDB ObjectId of a Promo discount code' },
  { key: 'voucherId', value: '', description: 'MongoDB ObjectId of a Plan Voucher' },
  { key: 'promoCode', value: 'WELCOME20', description: 'Sample promo code for discount checkout' },
  { key: 'voucherCode', value: 'VIPFREE30', description: 'Sample voucher code for full plan grant' },
  { key: 'announcementId', value: '', description: 'MongoDB ObjectId of an In-App Announcement' },
  { key: 'notificationId', value: '', description: 'MongoDB ObjectId of a user notification' },
  { key: 'legalSlug', value: 'privacy-policy', description: 'Slug of statutory legal policy' }
];

for (const rv of requiredVars) {
  const existing = collection.variable.find((v) => v.key === rv.key);
  if (!existing) {
    collection.variable.push({
      key: rv.key,
      value: rv.value,
      type: 'string',
      description: rv.description
    });
  } else {
    if (!existing.description) existing.description = rv.description;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. HELPER TO CREATE REQUEST OBJECTS
// ─────────────────────────────────────────────────────────────────────────────
function buildUrl(rawUrl, query = []) {
  // extract host & path from rawUrl (assumed starts with {{baseUrl}} or {{rootUrl}})
  const withoutProtocol = rawUrl.replace(/^https?:\/\//, '');
  const urlParts = withoutProtocol.split('?')[0].split('/');
  const host = [urlParts[0]];
  const pathParts = urlParts.slice(1).filter(Boolean);

  const urlObj = {
    raw: rawUrl,
    host,
    path: pathParts
  };
  if (query.length > 0) {
    urlObj.query = query;
  }
  return urlObj;
}

function makeRequest({
  name,
  method,
  rawUrl,
  headers = [],
  body = null,
  query = [],
  description = '',
  event = []
}) {
  const req = {
    method,
    header: headers,
    url: buildUrl(rawUrl, query),
    description
  };
  if (body) {
    req.body = {
      mode: 'raw',
      raw: typeof body === 'string' ? body : JSON.stringify(body, null, 2),
      options: {
        raw: {
          language: 'json'
        }
      }
    };
  }
  const item = {
    name,
    request: req,
    response: []
  };
  if (event && event.length > 0) {
    item.event = event;
  }
  return item;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RETRIEVE CURRENT ROOT FOLDERS
// ─────────────────────────────────────────────────────────────────────────────
let mobileFolder = collection.item.find((i) => i.name === 'MOBILE APP');
let adminFolder = collection.item.find((i) => i.name === 'ADMIN PANEL');
let sharedFolder = collection.item.find((i) => i.name === 'SHARED');

// Helper to find existing subfolder or create new
function findSubfolder(parent, matchStr) {
  return parent.item.find((f) => f.name && f.name.toLowerCase().includes(matchStr.toLowerCase()));
}

// Helper to find request inside a folder
function findReq(folder, method, pathSubstring) {
  if (!folder || !folder.item) return null;
  return folder.item.find((it) => {
    if (!it.request) return false;
    const m = it.request.method === method;
    const raw = (it.request.url && it.request.url.raw) || '';
    return m && raw.includes(pathSubstring);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. MOBILE APP FOLDERS
// ─────────────────────────────────────────────────────────────────────────────

// 4.1 Authentication
const fAuth = findSubfolder(mobileFolder, 'Authentication');

// 4.2 Profile & Onboarding
const fProfile = findSubfolder(mobileFolder, 'Profile & Onboarding');
if (fProfile) {
  // Ensure PATCH profile exists
  if (!findReq(fProfile, 'PATCH', '/auth/profile')) {
    fProfile.item.push(
      makeRequest({
        name: 'Edit Profile (Partial Update - PATCH)',
        method: 'PATCH',
        rawUrl: '{{baseUrl}}/auth/profile',
        headers: [
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' },
          { key: 'Content-Type', value: 'application/json', type: 'text' }
        ],
        body: {
          firstName: 'Kartik',
          lastName: 'Sharma',
          email: 'kartik.sharma@example.com'
        },
        description: 'Partially update user profile fields using PATCH method.'
      })
    );
  }
}

// 4.3 Notifications
const fNotif = findSubfolder(mobileFolder, 'Notifications');

// 4.4 Subscriptions & Paywall
const fSub = findSubfolder(mobileFolder, 'Subscriptions');

// 4.5 Video Player & Stream Engine
const fPlayer = findSubfolder(mobileFolder, 'Video Player');
if (fPlayer) {
  // Check Episode Access (POST Body)
  if (!findReq(fPlayer, 'POST', '/player/access')) {
    fPlayer.item.push(
      makeRequest({
        name: 'Check Episode Access (POST Body)',
        method: 'POST',
        rawUrl: '{{baseUrl}}/player/access',
        headers: [
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' },
          { key: 'Content-Type', value: 'application/json', type: 'text' }
        ],
        body: {
          dramaId: '{{dramaId}}',
          episodeNumber: 2
        },
        description: 'Verify user entitlement and lock/unlock status for a specific episode using JSON payload.'
      })
    );
  }
  // Play Series Default Episode
  if (!findReq(fPlayer, 'GET', '/player/play/{{dramaId}}') && !findReq(fPlayer, 'GET', '/player/play/{{dramaSlug}}')) {
    fPlayer.item.push(
      makeRequest({
        name: 'Play Series Default Episode',
        method: 'GET',
        rawUrl: '{{baseUrl}}/player/play/{{dramaId}}',
        headers: [
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' }
        ],
        description: 'Play the first episode or resume playback at the last watched position for a drama.'
      })
    );
  }
  // Player Continue Watching Shortcut
  if (!findReq(fPlayer, 'GET', '/player/continue-watching')) {
    fPlayer.item.push(
      makeRequest({
        name: 'Continue Watching (Player Shortcut)',
        method: 'GET',
        rawUrl: '{{baseUrl}}/player/continue-watching?page=1&limit=10',
        headers: [
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' }
        ],
        query: [
          { key: 'page', value: '1', description: 'Page number' },
          { key: 'limit', value: '10', description: 'Number of items per page' }
        ],
        description: 'Direct player shortcut to fetch ongoing watch progress and unfinished episodes.'
      })
    );
  }
}

// 4.6 Content Catalog (Dramas) - Brand new dedicated folder under Mobile App
let fDramas = findSubfolder(mobileFolder, 'Content Catalog') || findSubfolder(mobileFolder, 'Drama');
if (!fDramas) {
  fDramas = {
    name: '6. Content Catalog (Dramas & Series)',
    description: 'Endpoints for browsing drama catalogs, priority listings, new releases, and drama-specific streaming endpoints.',
    item: [
      makeRequest({
        name: '6.1 Get All Dramas (Paginated)',
        method: 'GET',
        rawUrl: '{{baseUrl}}/dramas?page=1&limit=10&genre=&search=&trending=',
        query: [
          { key: 'page', value: '1', description: 'Page number' },
          { key: 'limit', value: '10', description: 'Items per page' },
          { key: 'genre', value: '', description: 'Filter by genre slug/ID' },
          { key: 'search', value: '', description: 'Search drama titles' },
          { key: 'trending', value: '', description: 'Filter trending only (true/false)' }
        ],
        description: 'Get active dramas with pagination, optional genre filter, keyword search, and trending sort.'
      }),
      makeRequest({
        name: '6.2 Get Single Drama Details',
        method: 'GET',
        rawUrl: '{{baseUrl}}/dramas/{{dramaId}}',
        headers: [
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' }
        ],
        description: 'Get comprehensive details of a drama, including synopsis, cast, director, total episodes, freeEpisodes, and tags.'
      }),
      makeRequest({
        name: '6.3 Get Dramas by Admin Priority Rank',
        method: 'GET',
        rawUrl: '{{baseUrl}}/dramas/prioritized?page=1&limit=10&genre=&sortOrder=asc',
        query: [
          { key: 'page', value: '1', description: 'Page number' },
          { key: 'limit', value: '10', description: 'Items per page' },
          { key: 'genre', value: '', description: 'Optional genre filter' },
          { key: 'sortOrder', value: 'asc', description: 'Sort priority: asc (highest priority first) or desc' }
        ],
        description: 'Retrieve content sorted by editorial priority rank assigned by administrators.'
      }),
      makeRequest({
        name: '6.4 Get New Releases Catalog',
        method: 'GET',
        rawUrl: '{{baseUrl}}/dramas/new-releases?page=1&limit=10&genre=',
        query: [
          { key: 'page', value: '1', description: 'Page number' },
          { key: 'limit', value: '10', description: 'Items per page' },
          { key: 'genre', value: '', description: 'Optional genre filter' }
        ],
        description: 'Fetch freshly published drama series released within the latest release window.'
      }),
      makeRequest({
        name: '6.5 Toggle Save Drama (Watch Later Shortcut)',
        method: 'POST',
        rawUrl: '{{baseUrl}}/dramas/{{dramaId}}/save',
        headers: [
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' }
        ],
        description: 'Convenience shortcut to add/remove a drama from user watch later / saved series directly from drama view.'
      }),
      makeRequest({
        name: '6.6 Get Drama Episodes List Drawer',
        method: 'GET',
        rawUrl: '{{baseUrl}}/dramas/{{dramaId}}/episodes?page=1&limit=20&current=1',
        headers: [
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' }
        ],
        query: [
          { key: 'page', value: '1', description: 'Page number' },
          { key: 'limit', value: '20', description: 'Episodes per page' },
          { key: 'current', value: '1', description: 'Currently playing episode' }
        ],
        description: 'Fetch paginated episodes with lock/unlock status, thumbnail, duration, and user completion flags.'
      }),
      makeRequest({
        name: '6.7 Check Drama Episode Access',
        method: 'GET',
        rawUrl: '{{baseUrl}}/dramas/{{dramaId}}/access/{{episodeNumber}}',
        headers: [
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' }
        ],
        description: 'Check whether user plan unlocks this episode or requires paywall initiation.'
      }),
      makeRequest({
        name: '6.8 Play Drama Episode Stream',
        method: 'GET',
        rawUrl: '{{baseUrl}}/dramas/{{dramaId}}/play/{{episodeNumber}}',
        headers: [
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' }
        ],
        description: 'Resolve video stream URL, subtitles, and resume position for episode playback.'
      }),
      makeRequest({
        name: '6.9 Stream Drama Episode (Stream Route Alias)',
        method: 'GET',
        rawUrl: '{{baseUrl}}/dramas/{{dramaId}}/episodes/{{episodeNumber}}/stream',
        headers: [
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' }
        ],
        description: 'RESTful streaming alias matching PRD specification.'
      }),
      makeRequest({
        name: '6.10 Record Drama Playback Progress',
        method: 'POST',
        rawUrl: '{{baseUrl}}/dramas/{{dramaId}}/progress',
        headers: [
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' },
          { key: 'Content-Type', value: 'application/json', type: 'text' }
        ],
        body: {
          episodeNumber: 2,
          lastPosition: 120,
          duration: 600,
          isCompleted: false
        },
        description: 'Save playback resume position and trigger Continue Watching synchronization.'
      })
    ]
  };
}

// 4.7 Search & Discovery
const fSearch = findSubfolder(mobileFolder, 'Search & Discovery');

// 4.8 Home & Discovery Feed
let fHome = findSubfolder(mobileFolder, 'Home & Discovery Feed');
if (fHome) {
  // Ensure Active Banners endpoint is present
  if (!findReq(fHome, 'GET', '/home/banners')) {
    fHome.item.unshift(
      makeRequest({
        name: 'Active Home Hero Banners Carousel',
        method: 'GET',
        rawUrl: '{{baseUrl}}/home/banners?limit=5&genre=',
        headers: [
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' }
        ],
        query: [
          { key: 'limit', value: '5', description: 'Number of active banners (default 5)' },
          { key: 'genre', value: '', description: 'Optional genre filter' }
        ],
        description: 'Fetch active hero carousel banners for mobile home screen with linked drama metadata and CTA.'
      })
    );
  }
}

// 4.9 User Library & Saved Series (Watch Later)
let fSaved = findSubfolder(mobileFolder, 'Saved Series') || findSubfolder(mobileFolder, 'User Library');
if (fSaved) {
  // Check Status alias
  if (!findReq(fSaved, 'GET', '/status')) {
    fSaved.item.push(
      makeRequest({
        name: 'Check Series Saved Status (Status Alias)',
        method: 'GET',
        rawUrl: '{{baseUrl}}/user/saved-series/{{dramaId}}/status',
        headers: [
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' }
        ],
        description: 'Alternative status endpoint checking whether drama is currently in watchlist.'
      })
    );
  }
  // PATCH settings
  if (!findReq(fSaved, 'PATCH', '/user/settings')) {
    fSaved.item.push(
      makeRequest({
        name: 'Update Playback & App Settings (PATCH Partial)',
        method: 'PATCH',
        rawUrl: '{{baseUrl}}/user/settings',
        headers: [
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' },
          { key: 'Content-Type', value: 'application/json', type: 'text' }
        ],
        body: {
          autoplayNext: true,
          streamQuality: 'auto'
        },
        description: 'Partially update user video player preferences and application settings.'
      })
    );
  }
}

// 4.10 Genres & Categories
const fGenres = findSubfolder(mobileFolder, 'Genres & Categories');

// 4.11 Ads & Monetization
const fAds = findSubfolder(mobileFolder, 'Ads & Monetization');

// ─────────────────────────────────────────────────────────────────────────────
// 5. ADMIN PANEL FOLDERS
// ─────────────────────────────────────────────────────────────────────────────

// 5.1 Admin Authentication
const fAdminAuth = findSubfolder(adminFolder, 'Authentication');

// 5.2 User Management
const fAdminUsers = findSubfolder(adminFolder, 'User Management');

// 5.3 Push Notifications & In-App Announcements
let fAdminNotif = findSubfolder(adminFolder, 'Notifications');
if (fAdminNotif) {
  // Fix toggle announcement if missing
  if (!findReq(fAdminNotif, 'PATCH', '/admin/announcements/')) {
    fAdminNotif.item.push(
      makeRequest({
        name: 'Toggle In-App Announcement Active Status',
        method: 'PATCH',
        rawUrl: '{{baseUrl}}/notifications/admin/announcements/{{announcementId}}/toggle',
        headers: [
          { key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' }
        ],
        description: 'Toggle active visibility of an in-app banner announcement on/off.'
      })
    );
  }
  // Standardize delete announcement URL
  const delAnn = findReq(fAdminNotif, 'DELETE', 'announcements');
  if (delAnn && delAnn.request && delAnn.request.url) {
    delAnn.request.url = buildUrl('{{baseUrl}}/notifications/admin/announcements/{{announcementId}}');
  }
}

// 5.4 Subscription & Monetization Management
const fAdminSub = findSubfolder(adminFolder, 'Subscription Management');

// 5.5 Content Library & Drama Management
const fAdminDrama = findSubfolder(adminFolder, 'Drama Management') || findSubfolder(adminFolder, 'Content Library');

// 5.6 Banners & Hero Carousel Management
const fAdminBanners = findSubfolder(adminFolder, 'Banners');

// 5.7 Home Category Sections & Content Priority
const fAdminSections = findSubfolder(adminFolder, 'Home Category Sections');

// 5.8 Genres & Categories Management
const fAdminGenres = findSubfolder(adminFolder, 'Genres & Categories Management');

// 5.9 Ads & AdMob Monetization Management
const fAdminAds = findSubfolder(adminFolder, 'Ads & AdMob');

// 5.10 Promo Codes Management
const fAdminPromos = findSubfolder(adminFolder, 'Promo Codes');

// 5.11 Plan Vouchers Management
const fAdminVouchers = findSubfolder(adminFolder, 'Plan Vouchers');

// ─────────────────────────────────────────────────────────────────────────────
// 6. SHARED FOLDERS
// ─────────────────────────────────────────────────────────────────────────────

// 6.1 File & Media Uploads
const fSharedUpload = findSubfolder(sharedFolder, 'Upload');

// 6.2 Legal & Statutory Compliance
let fSharedLegal = findSubfolder(sharedFolder, 'Legal');
if (fSharedLegal) {
  if (!findReq(fSharedLegal, 'PATCH', '/legal/admin/')) {
    fSharedLegal.item.push(
      makeRequest({
        name: '[Admin] Toggle Legal Policy Active Status',
        method: 'PATCH',
        rawUrl: '{{baseUrl}}/legal/admin/{{legalSlug}}/toggle',
        headers: [
          { key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' }
        ],
        description: 'Toggle published / hidden status of a legal statutory policy.'
      })
    );
  }
  if (!findReq(fSharedLegal, 'PUT', '/legal/admin/compliance')) {
    fSharedLegal.item.push(
      makeRequest({
        name: '[Admin] Update Grievance & Statutory Compliance Officer',
        method: 'PUT',
        rawUrl: '{{baseUrl}}/legal/admin/compliance',
        headers: [
          { key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' },
          { key: 'Content-Type', value: 'application/json', type: 'text' }
        ],
        body: {
          name: 'Nodal Compliance Officer',
          designation: 'Grievance Officer & Legal Head',
          email: 'grievance@e2stories.com',
          address: 'E2 Stories Digital Media Pvt Ltd, Mumbai, Maharashtra 400001',
          sla: 'Within 24 hours acknowledgment, 15 days redressal as per Indian IT Rules 2021',
          certifiedMaturityTags: ['U', 'U/A 7+', 'U/A 13+', 'U/A 16+', 'A']
        },
        description: 'Update statutory Grievance Redressal Officer and age-classification maturity metadata under Indian IT Rules 2021.'
      })
    );
  }
}

// 6.3 System & Health Check
let fSharedSystem = findSubfolder(sharedFolder, 'System');
if (!fSharedSystem) {
  fSharedSystem = {
    name: '3. System & Health Check',
    item: []
  };
}
if (!findReq(fSharedSystem, 'GET', '/health')) {
  fSharedSystem.item.push(
    makeRequest({
      name: 'Service Health Check',
      method: 'GET',
      rawUrl: '{{baseUrl}}/health',
      description: 'Check backend API operational health, uptime, and database connection status.'
    })
  );
}
if (!findReq(fSharedSystem, 'GET', '{{rootUrl}}')) {
  fSharedSystem.item.push(
    makeRequest({
      name: 'Root Welcome & Service Status',
      method: 'GET',
      rawUrl: '{{rootUrl}}/',
      description: 'Root HTTP welcome ping returning service metadata and API version.'
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. STANDARDIZE FOLDER TITLES AND REORDER SEQUENTIALLY
// ─────────────────────────────────────────────────────────────────────────────

function renumberItems(items, folderNum) {
  items.forEach((it, idx) => {
    const cleanName = it.name.replace(/^[0-9]+\.[0-9]+\s+/, '');
    it.name = `${folderNum}.${idx + 1} ${cleanName}`;
  });
}

// MOBILE APP ORDER (1 to 11)
const orderedMobile = [
  { folder: fAuth, name: '1. Authentication' },
  { folder: fProfile, name: '2. Profile & Onboarding' },
  { folder: fNotif, name: '3. Notifications' },
  { folder: fSub, name: '4. Subscriptions & Paywall' },
  { folder: fPlayer, name: '5. Video Player & Stream Engine' },
  { folder: fDramas, name: '6. Content Catalog (Dramas & Series)' },
  { folder: fSearch, name: '7. Search & Discovery' },
  { folder: fHome, name: '8. Home & Discovery Feed' },
  { folder: fSaved, name: '9. User Library & Saved Series (Watch Later)' },
  { folder: fGenres, name: '10. Genres & Categories' },
  { folder: fAds, name: '11. Ads & Monetization' }
].filter((x) => x.folder);

orderedMobile.forEach(({ folder, name }, i) => {
  folder.name = name;
  renumberItems(folder.item, i + 1);
});
mobileFolder.item = orderedMobile.map((x) => x.folder);

// ADMIN PANEL ORDER (1 to 11)
const orderedAdmin = [
  { folder: fAdminAuth, name: '1. Admin Authentication' },
  { folder: fAdminUsers, name: '2. User Management' },
  { folder: fAdminNotif, name: '3. Push Notifications & In-App Announcements' },
  { folder: fAdminSub, name: '4. Subscription & Monetization Management' },
  { folder: fAdminDrama, name: '5. Content Library & Drama Management' },
  { folder: fAdminBanners, name: '6. Banners & Hero Carousel Management' },
  { folder: fAdminSections, name: '7. Home Category Sections & Content Priority' },
  { folder: fAdminGenres, name: '8. Genres & Categories Management' },
  { folder: fAdminAds, name: '9. Ads & AdMob Monetization Management' },
  { folder: fAdminPromos, name: '10. Promo Codes Management (Discount Coupons)' },
  { folder: fAdminVouchers, name: '11. Plan Vouchers Management (Complete Plan Access)' }
].filter((x) => x.folder);

orderedAdmin.forEach(({ folder, name }, i) => {
  folder.name = name;
  renumberItems(folder.item, i + 1);
});
adminFolder.item = orderedAdmin.map((x) => x.folder);

// SHARED ORDER (1 to 3)
const orderedShared = [
  { folder: fSharedUpload, name: '1. File & Media Uploads' },
  { folder: fSharedLegal, name: '2. Legal & Statutory Compliance' },
  { folder: fSharedSystem, name: '3. System & Health Check' }
].filter((x) => x.folder);

orderedShared.forEach(({ folder, name }, i) => {
  folder.name = name;
  renumberItems(folder.item, i + 1);
});
sharedFolder.item = orderedShared.map((x) => x.folder);

// Write back updated JSON
fs.writeFileSync(postmanPath, JSON.stringify(collection, null, 2), 'utf8');
console.log('✅ Successfully updated Postman collection with all APIs!');
