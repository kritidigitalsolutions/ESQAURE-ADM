import fs from 'fs';
import path from 'path';

const postmanPath = path.resolve('E2_Stories_OTT_Auth_APIs.postman_collection.json');
const rawData = fs.readFileSync(postmanPath, 'utf8');
const collection = JSON.parse(rawData);

// Locate MOBILE APP -> 9. User Library & Saved Series (Watch Later)
const mobileAppFolder = collection.item.find((it) => it.name.toUpperCase().includes('MOBILE APP'));
if (!mobileAppFolder) {
  console.error('MOBILE APP folder not found');
  process.exit(1);
}

const userLibraryFolder = mobileAppFolder.item.find((it) => it.name.includes('User Library'));
if (!userLibraryFolder) {
  console.error('User Library folder not found');
  process.exit(1);
}

// Build enhanced Watch History items
const watchHistoryItems = [
  {
    name: '9.7 User Watch History (Full Viewing Activity)',
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
        raw: '{{baseUrl}}/user/watch-history?page=1&limit=20&search=&status=all&period=all&sortBy=recent&view=dramas&groupBy=none',
        host: ['{{baseUrl}}'],
        path: ['user', 'watch-history'],
        query: [
          { key: 'page', value: '1', description: 'Page number (default: 1)' },
          { key: 'limit', value: '20', description: 'Records per page (1-100, default: 20)' },
          { key: 'search', value: '', description: 'Search matching drama title (case-insensitive regex)' },
          { key: 'status', value: 'all', description: 'Watch status filter: all | in-progress | completed' },
          { key: 'period', value: 'all', description: 'Timeline filter: all | today | yesterday | this_week | this_month' },
          { key: 'sortBy', value: 'recent', description: 'Sort order: recent | oldest | progress | title' },
          { key: 'view', value: 'dramas', description: 'View format: dramas (drama cards) | episodes (itemized episodes) | grouped' },
          { key: 'groupBy', value: 'none', description: 'Date grouping: none | date (Today, Yesterday, This Week, Earlier)' }
        ]
      },
      description: 'Comprehensive OTT viewing activity feed. Returns drama card, resume episode, duration, progress %, remaining time, humanized relative time (e.g. "2 hours ago"), date grouping buckets, and summary statistics (total watched, cumulative watch time).'
    },
    response: []
  },
  {
    name: '9.7.1 Watch History Direct Shortcut (GET /watch-history)',
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
        raw: '{{baseUrl}}/watch-history?page=1&limit=20&status=in-progress',
        host: ['{{baseUrl}}'],
        path: ['watch-history'],
        query: [
          { key: 'page', value: '1', description: 'Page number' },
          { key: 'limit', value: '20', description: 'Records per page' },
          { key: 'status', value: 'in-progress', description: 'Filter continue watching / in-progress' }
        ]
      },
      description: 'Top-level shortcut route for Watch History (identical to /user/watch-history).'
    },
    response: []
  },
  {
    name: '9.7.2 Watch History Statistics Summary',
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
        raw: '{{baseUrl}}/watch-history/summary',
        host: ['{{baseUrl}}'],
        path: ['watch-history', 'summary']
      },
      description: 'Cumulative viewing analytics: total titles watched, total episodes watched, completed count, in-progress count, total watch time in seconds and formatted (e.g. "3h 45m"), top 5 watched genres, and most recently watched title card.'
    },
    response: []
  },
  {
    name: '9.7.3 Drama Viewing History Breakdown',
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
        raw: '{{baseUrl}}/watch-history/drama/:dramaId',
        host: ['{{baseUrl}}'],
        path: ['watch-history', 'drama', ':dramaId'],
        variable: [
          {
            key: 'dramaId',
            value: '{{dramaId}}',
            description: 'Drama ObjectId or slug'
          }
        ]
      },
      description: 'Detailed viewing history for a single drama series. Returns overall series progress %, current resume episode, and all individual episodes watched with their progress bars.'
    },
    response: []
  },
  {
    name: '9.7.4 Record / Sync Playback Progress',
    request: {
      method: 'POST',
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
            dramaId: '{{dramaId}}',
            episodeNumber: 1,
            watchedSeconds: 60,
            durationSeconds: 120,
            isCompleted: false
          },
          null,
          2
        )
      },
      url: {
        raw: '{{baseUrl}}/watch-history',
        host: ['{{baseUrl}}'],
        path: ['watch-history']
      },
      description: 'Explicitly record or sync playback scrubber progress into user watch history. Automatically maintains drama-level resume point and episode history list.'
    },
    response: []
  },
  {
    name: '9.7.5 Mark Drama or Episode as Completed',
    request: {
      method: 'POST',
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
            dramaId: '{{dramaId}}',
            episodeNumber: 1
          },
          null,
          2
        )
      },
      url: {
        raw: '{{baseUrl}}/watch-history/mark-completed',
        host: ['{{baseUrl}}'],
        path: ['watch-history', 'mark-completed']
      },
      description: 'Marks an episode or entire drama series as completed (100% progress) in viewing history.'
    },
    response: []
  },
  {
    name: '9.7.6 Remove Content from Watch History',
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
        raw: '{{baseUrl}}/watch-history/:historyId',
        host: ['{{baseUrl}}'],
        path: ['watch-history', ':historyId'],
        variable: [
          {
            key: 'historyId',
            value: '',
            description: 'History record ID or Drama ID to remove'
          }
        ]
      },
      description: 'Deletes an individual title from user watch history.'
    },
    response: []
  },
  {
    name: '9.7.7 Remove Entire Drama from Watch History',
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
        raw: '{{baseUrl}}/watch-history/drama/:dramaId',
        host: ['{{baseUrl}}'],
        path: ['watch-history', 'drama', ':dramaId'],
        variable: [
          {
            key: 'dramaId',
            value: '{{dramaId}}',
            description: 'Drama ObjectId or slug to remove completely from history'
          }
        ]
      },
      description: 'Removes all viewing history records for a specified drama series.'
    },
    response: []
  },
  {
    name: '9.7.8 Clear All Watch History',
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
        raw: '{{baseUrl}}/watch-history',
        host: ['{{baseUrl}}'],
        path: ['watch-history']
      },
      description: 'Wipes the user complete viewing history and watch activity.'
    },
    response: []
  }
];

// Find index of existing 9.7 User Watch History item
const existingIdx = userLibraryFolder.item.findIndex((it) => it.name.includes('Watch History'));
if (existingIdx >= 0) {
  // Replace the single item with the comprehensive suite
  userLibraryFolder.item.splice(existingIdx, 1, ...watchHistoryItems);
} else {
  userLibraryFolder.item.push(...watchHistoryItems);
}

fs.writeFileSync(postmanPath, JSON.stringify(collection, null, 2), 'utf8');
console.log(`Successfully updated Postman collection with ${watchHistoryItems.length} Watch History endpoints!`);
