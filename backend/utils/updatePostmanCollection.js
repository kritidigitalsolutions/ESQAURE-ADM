import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const postmanPath = path.resolve(__dirname, '../../E2_Stories_OTT_Auth_APIs.postman_collection.json');

const raw = fs.readFileSync(postmanPath, 'utf8');
const collection = JSON.parse(raw);

// 1. Ensure `dramaId` is in collection variables
if (!collection.variable.some((v) => v.key === 'dramaId')) {
  collection.variable.push({
    key: 'dramaId',
    value: '',
    type: 'string',
    description: 'MongoDB ObjectId or slug of a Drama for testing player, access, and saved-series'
  });
  console.log('[OK] Added dramaId variable to collection');
}

// 2. Locate MOBILE APP folder
const mobileFolder = collection.item.find((i) => i.name === 'MOBILE APP');
if (!mobileFolder) {
  console.error('[ERR] MOBILE APP folder not found');
  process.exit(1);
}

// 3. Remove existing "9. User Library & Saved Series" if previously added to avoid duplicates
mobileFolder.item = mobileFolder.item.filter(
  (it) => !it.name.includes('Saved Series') && !it.name.includes('User Library')
);

// 4. Construct folder "9. User Library & Saved Series (Watch Later)"
const savedSeriesFolder = {
  name: '9. User Library & Saved Series (Watch Later)',
  description:
    'Endpoints for managing user-saved series (Watchlist), Watch Later playback triggers, resume state synchronization, and user library settings.',
  item: [
    {
      name: '9.1 Get Saved Series (Watch Later)',
      request: {
        method: 'GET',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{authToken}}',
            type: 'text'
          }
        ],
        url: {
          raw: '{{baseUrl}}/user/saved-series?page=1&limit=20&sortBy=recent',
          host: ['{{baseUrl}}'],
          path: ['user', 'saved-series'],
          query: [
            {
              key: 'page',
              value: '1',
              description: 'Page number (default 1)'
            },
            {
              key: 'limit',
              value: '20',
              description: 'Number of series per page (max 100)'
            },
            {
              key: 'search',
              value: '',
              description: 'Filter saved series by title or synopsis keyword'
            },
            {
              key: 'genre',
              value: '',
              description: 'Filter by genre name, slug, or ID'
            },
            {
              key: 'sortBy',
              value: 'recent',
              description: 'Sort by recent | rating | title | episodes'
            }
          ]
        },
        description:
          'Fetches the authenticated user\'s saved series (Watchlist) with pagination. Each item includes full drama metadata along with real-time watchProgress (resumeEpisodeNumber, progressPercentage, actionLabel: "Resume Ep X" or "Watch Now") for seamless "Watch Later" functionality.'
      },
      response: []
    },
    {
      name: '9.2 Toggle Save Series (+ / - Watch Later)',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'const r = pm.response.json();',
              'if (r.success && r.data) {',
              '    console.log(`[OK] Saved status for ${r.data.dramaTitle}: isSaved=${r.data.isSaved} (${r.data.action})`);',
              '}'
            ]
          }
        }
      ],
      request: {
        method: 'POST',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{authToken}}',
            type: 'text'
          }
        ],
        url: {
          raw: '{{baseUrl}}/user/saved-series/{{dramaId}}',
          host: ['{{baseUrl}}'],
          path: ['user', 'saved-series', '{{dramaId}}']
        },
        description:
          'Toggles drama in user\'s saved series watchlist (+ / -). If not saved, adds it (isSaved: true, action: "ADDED"). If already saved, removes it (isSaved: false, action: "REMOVED"). Supports both drama ObjectId and slug.'
      },
      response: []
    },
    {
      name: '9.3 Check If Series Is Saved',
      request: {
        method: 'GET',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{authToken}}',
            type: 'text'
          }
        ],
        url: {
          raw: '{{baseUrl}}/user/saved-series/check/{{dramaId}}',
          host: ['{{baseUrl}}'],
          path: ['user', 'saved-series', 'check', '{{dramaId}}']
        },
        description:
          'Quickly checks whether a specific drama is saved in the user\'s watchlist. Returns { isSaved: boolean, addedAt: timestamp }.'
      },
      response: []
    },
    {
      name: '9.4 Remove Series from Watchlist',
      request: {
        method: 'DELETE',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{authToken}}',
            type: 'text'
          }
        ],
        url: {
          raw: '{{baseUrl}}/user/saved-series/{{dramaId}}',
          host: ['{{baseUrl}}'],
          path: ['user', 'saved-series', '{{dramaId}}']
        },
        description:
          'Explicit REST removal endpoint. Removes a specific drama from the user\'s saved series.'
      },
      response: []
    },
    {
      name: '9.5 Clear All Saved Series',
      request: {
        method: 'DELETE',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{authToken}}',
            type: 'text'
          }
        ],
        url: {
          raw: '{{baseUrl}}/user/saved-series',
          host: ['{{baseUrl}}'],
          path: ['user', 'saved-series']
        },
        description: 'Permanently removes all saved series from the user\'s watchlist.'
      },
      response: []
    },
    {
      name: '9.6 User Library Profile Overview',
      request: {
        method: 'GET',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{authToken}}',
            type: 'text'
          }
        ],
        url: {
          raw: '{{baseUrl}}/user/profile',
          host: ['{{baseUrl}}'],
          path: ['user', 'profile']
        },
        description:
          'Retrieves user profile info along with library metrics: savedSeriesCount, watchHistoryCount, and completedCount.'
      },
      response: []
    },
    {
      name: '9.7 User Watch History',
      request: {
        method: 'GET',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{authToken}}',
            type: 'text'
          }
        ],
        url: {
          raw: '{{baseUrl}}/user/watch-history?page=1&limit=20',
          host: ['{{baseUrl}}'],
          path: ['user', 'watch-history'],
          query: [
            {
              key: 'page',
              value: '1',
              description: 'Page number'
            },
            {
              key: 'limit',
              value: '20',
              description: 'Records per page'
            }
          ]
        },
        description:
          'Chronological watch history listing with resume playback timestamps, duration, and completion flags.'
      },
      response: []
    },
    {
      name: '9.8 Update Playback & App Settings',
      request: {
        method: 'PUT',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{authToken}}',
            type: 'text'
          },
          {
            key: 'Content-Type',
            value: 'application/json',
            type: 'text'
          }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              autoplayNext: true,
              videoQuality: '1080p',
              subtitlesLanguage: 'Hindi',
              playbackSpeed: '1x',
              appLanguage: 'English',
              preferredContentLanguages: ['Hindi', 'English'],
              notifications: {
                newEpisodes: true,
                newReleases: true,
                recommendations: true
              }
            },
            null,
            2
          ),
          options: {
            raw: {
              language: 'json'
            }
          }
        },
        url: {
          raw: '{{baseUrl}}/user/settings',
          host: ['{{baseUrl}}'],
          path: ['user', 'settings']
        },
        description:
          'Updates playback preferences (autoplay, video quality 1080p/720p/Auto, subtitles) and notifications.'
      },
      response: []
    }
  ]
};

mobileFolder.item.push(savedSeriesFolder);

fs.writeFileSync(postmanPath, JSON.stringify(collection, null, 2), 'utf8');
console.log('[OK] Postman collection successfully updated with 9. User Library & Saved Series');
