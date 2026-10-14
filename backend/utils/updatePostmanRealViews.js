import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const collectionPath = path.resolve(__dirname, '../../E2_Stories_OTT_Auth_APIs.postman_collection.json');

const raw = fs.readFileSync(collectionPath, 'utf8');
const collection = JSON.parse(raw);

// 1. Locate Mobile App -> 5. Video Player & Stream Engine
const mobileApp = collection.item.find((i) => i.name === 'MOBILE APP');
if (!mobileApp) {
  console.error('MOBILE APP group not found in collection');
  process.exit(1);
}

const playerFolder = mobileApp.item.find((i) => i.name.includes('Video Player'));
if (!playerFolder) {
  console.error('Video Player folder not found');
  process.exit(1);
}

// Update 5.4 Sync Playback Progress description
const progressItem = playerFolder.item.find((i) => i.name.includes('Sync Playback Progress'));
if (progressItem) {
  progressItem.request.description =
    'Syncs player playback scrubber heartbeat every 5-10 seconds. Automatically updates user WatchHistory and evaluates real view qualification. If the user watches >= 10 seconds or 20% of episode duration, credits exactly 1 real view. Subsequent progress pings in the same session are debounced via a 30-minute cooldown window, preventing artificial inflation. NOTE: Trailer and preview teaser playbacks (isTrailer: true, mediaType: "TRAILER", or episodeNumber: 0) and locked episode preview teasers are STRICTLY EXCLUDED from counting towards official episode and drama view counts.';
}

// Remove old items if already exist
playerFolder.item = playerFolder.item.filter(
  (i) => !i.name.includes('Explicit Real View') && !i.name.includes('Real View Timeseries')
);

// Add 5.9 Explicit Real View Logging
playerFolder.item.push({
  name: '5.9 Explicit Real View Logging',
  request: {
    method: 'POST',
    header: [
      {
        key: 'Content-Type',
        value: 'application/json'
      },
      {
        key: 'Authorization',
        value: 'Bearer {{userToken}}',
        description: 'Optional JWT auth token. If omitted, device fingerprint / IP hash is used.'
      },
      {
        key: 'x-device-id',
        value: 'pixel-7a-device-101',
        description: 'Optional client hardware device ID'
      }
    ],
    body: {
      mode: 'raw',
      raw: JSON.stringify(
        {
          dramaId: '{{dramaSlug}}',
          episodeNumber: 1,
          watchedSeconds: 15,
          durationSeconds: 135
        },
        null,
        2
      )
    },
    url: {
      raw: '{{baseUrl}}/player/view',
      host: ['{{baseUrl}}'],
      path: ['player', 'view']
    },
    description:
      'Dedicated callback endpoint for client player engines (ExoPlayer, AVPlayer, Video.js) once playback crosses the legitimate view threshold (>= 10 seconds or 20%). Features automatic anti-inflation deduplication and a 30-minute cooldown.'
  },
  response: []
});

// Add 5.10 Real View Timeseries Analytics
playerFolder.item.push({
  name: '5.10 Real View Timeseries Analytics',
  request: {
    method: 'GET',
    header: [
      {
        key: 'Authorization',
        value: 'Bearer {{userToken}}',
        description: 'Optional auth token'
      }
    ],
    url: {
      raw: '{{baseUrl}}/player/analytics/{{dramaSlug}}?days=30',
      host: ['{{baseUrl}}'],
      path: ['player', 'analytics', '{{dramaSlug}}'],
      query: [
        {
          key: 'days',
          value: '30',
          description: 'Number of past days for timeseries breakdown (1 to 90, default: 30)'
        }
      ]
    },
    description:
      'Fetches real view metrics for a drama: total catalog views, unique viewers count, today views, completed views, completion percentage rate, average watch duration, and daily breakdown.'
  },
  response: []
});

// 2. Locate Admin Panel -> 5. Content Library & Drama Management
const adminPanel = collection.item.find((i) => i.name === 'ADMIN PANEL');
if (adminPanel) {
  const contentFolder = adminPanel.item.find((i) => i.name.includes('Content Library'));
  if (contentFolder) {
    contentFolder.item = contentFolder.item.filter((i) => !i.name.includes('Reconcile Drama View'));
    contentFolder.item.push({
      name: '5.9 Reconcile Drama View Counts',
      request: {
        method: 'POST',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{adminToken}}',
            description: 'Master Admin Bearer Token or Firebase ID token'
          }
        ],
        url: {
          raw: '{{baseUrl}}/player/reconcile-views/{{dramaId}}',
          host: ['{{baseUrl}}'],
          path: ['player', 'reconcile-views', '{{dramaId}}']
        },
        description:
          'Administrative maintenance action: recalculates and synchronizes Drama.viewsCount from the exact sum of Episode.viewsCount to guarantee 100% data integrity without any drift.'
      },
      response: []
    });
  }
}

// Save back formatted collection
fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf8');
console.log('✅ Postman Collection successfully updated with Real View Count endpoints!');
