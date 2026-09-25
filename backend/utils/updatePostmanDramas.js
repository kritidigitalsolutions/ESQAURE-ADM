import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const collectionPath = path.resolve(__dirname, '../../E2_Stories_OTT_Auth_APIs.postman_collection.json');

const raw = fs.readFileSync(collectionPath, 'utf8');
const collection = JSON.parse(raw);

const adminPanel = collection.item.find((i) => i.name === 'ADMIN PANEL');
if (!adminPanel) {
  console.error('ADMIN PANEL group not found in collection');
  process.exit(1);
}

// Remove old Content Library folder if present
adminPanel.item = adminPanel.item.filter((i) => !i.name.includes('Content Library') && !i.name.includes('Dramas'));

const dramasAdminFolder = {
  name: '8. Content Library & Drama Management',
  description:
    'Admin panel management APIs for Content Library (Dramas/Series). Includes fetching real dynamic drama catalog with stats, creating new series, updating metadata, deleting series, toggling active/inactive status, toggling paid/free access, setting priority ranks, and managing episodes.',
  item: [
    {
      name: '8.1 Get Admin Content Library & Catalog Stats',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/dramas/admin',
          host: ['{{baseUrl}}'],
          path: ['dramas', 'admin']
        },
        description: 'Fetch all drama series for admin with stats (totalSeries, published, totalEpisodes, totalStreams, topDrama, watchTime).'
      },
      response: []
    },
    {
      name: '8.2 Create New Drama Series',
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            title: 'New Romantic Drama Series',
            synopsis: 'A captivating story of love and fate.',
            posterUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=720&q=80',
            bannerUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=1280&q=80',
            trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            genres: ['Romance', 'Drama'],
            totalEpisodes: 24,
            freeEpisodes: 3,
            isPaid: true,
            plan: 'Premium Plan',
            status: 'PUBLISHED',
            priority: 1
          }, null, 2)
        },
        url: { raw: '{{baseUrl}}/dramas', host: ['{{baseUrl}}'], path: ['dramas'] },
        description: 'Create a new drama series in the catalog.'
      },
      response: []
    },
    {
      name: '8.3 Update Drama Series Details',
      request: {
        method: 'PATCH',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({ title: 'Updated Drama Title', totalEpisodes: 30, freeEpisodes: 4 }, null, 2)
        },
        url: { raw: '{{baseUrl}}/dramas/{{dramaId}}', host: ['{{baseUrl}}'], path: ['dramas', '{{dramaId}}'] },
        description: 'Update metadata, assets, paywall, or episodes count of a drama.'
      },
      response: []
    },
    {
      name: '8.4 Toggle Drama Active/Inactive Status',
      request: {
        method: 'PATCH',
        header: [],
        url: { raw: '{{baseUrl}}/dramas/{{dramaId}}/toggle-active', host: ['{{baseUrl}}'], path: ['dramas', '{{dramaId}}', 'toggle-active'] },
        description: 'Toggle drama status between PUBLISHED (Active) and DRAFT (Inactive).'
      },
      response: []
    },
    {
      name: '8.5 Toggle Drama Paid/Free Access',
      request: {
        method: 'PATCH',
        header: [],
        url: { raw: '{{baseUrl}}/dramas/{{dramaId}}/toggle-paid', host: ['{{baseUrl}}'], path: ['dramas', '{{dramaId}}', 'toggle-paid'] },
        description: 'Toggle drama access between Paid (with plan tier) and Free Tier.'
      },
      response: []
    },
    {
      name: '8.6 Set/Update Drama Priority Rank',
      request: {
        method: 'PATCH',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: { mode: 'raw', raw: JSON.stringify({ priority: 1 }, null, 2) },
        url: { raw: '{{baseUrl}}/dramas/{{dramaId}}/priority', host: ['{{baseUrl}}'], path: ['dramas', '{{dramaId}}', 'priority'] },
        description: 'Set priority rank for drama. Automatically normalizes remaining catalog priorities.'
      },
      response: []
    },
    {
      name: '8.7 Delete Drama Series',
      request: {
        method: 'DELETE',
        header: [],
        url: { raw: '{{baseUrl}}/dramas/{{dramaId}}', host: ['{{baseUrl}}'], path: ['dramas', '{{dramaId}}'] },
        description: 'Permanently delete a drama series and its associated episodes.'
      },
      response: []
    },
    {
      name: '8.8 Save/Update Drama Episodes & Paywall',
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({ freeEpisodes: 3, episodes: [{ episodeNumber: 1, title: 'Episode 1: The Beginning', isFree: true }] }, null, 2)
        },
        url: { raw: '{{baseUrl}}/dramas/{{dramaId}}/episodes/admin', host: ['{{baseUrl}}'], path: ['dramas', '{{dramaId}}', 'episodes', 'admin'] },
        description: 'Save or update episodes list and paywall rules for a drama.'
      },
      response: []
    }
  ]
};

adminPanel.item.push(dramasAdminFolder);

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf8');
console.log('Postman collection successfully updated with Content Library (Dramas) Admin APIs!');
