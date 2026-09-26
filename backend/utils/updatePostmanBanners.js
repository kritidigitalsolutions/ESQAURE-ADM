import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const collectionPath = path.resolve(__dirname, '../../E2_Stories_OTT_Auth_APIs.postman_collection.json');

const raw = fs.readFileSync(collectionPath, 'utf8');
const collection = JSON.parse(raw);

// Ensure bannerId variable exists
if (!collection.variable.some((v) => v.key === 'bannerId')) {
  collection.variable.push({
    key: 'bannerId',
    value: '',
    type: 'string',
    description: 'MongoDB ObjectId of a Banner'
  });
}

// 1. MOBILE APP -> Check or update Mobile App Home folder with Hero Banners
const mobileApp = collection.item.find((i) => i.name === 'MOBILE APP');
if (mobileApp) {
  let homeFolder = mobileApp.item.find((i) => i.name.includes('Home & Discovery'));
  if (homeFolder) {
    // Check if banners endpoint already in homeFolder
    if (!homeFolder.item.some((i) => i.name.includes('Hero Banners') || i.name.includes('Banners'))) {
      homeFolder.item.unshift({
        name: '7.0 Home Hero Banners Carousel',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{authToken}}',
              type: 'text',
              description: 'Optional — provides personalized saved/watchlist status'
            }
          ],
          url: {
            raw: '{{baseUrl}}/home/banners?limit=5',
            host: ['{{baseUrl}}'],
            path: ['home', 'banners'],
            query: [
              {
                key: 'limit',
                value: '5',
                description: 'Number of active hero banners to return (default 5, max 10)'
              },
              {
                key: 'genre',
                value: '',
                description: 'Optional genre filter slug or ObjectId'
              }
            ]
          },
          description:
            'Fetches active hero carousel banners configured by the admin, or dynamically falls back to top-priority featured dramas. Returns formatted title, subtitle, 16:9 bannerUrl, portrait posterUrl, teaser video trailerUrl, and CTA action.'
        },
        response: []
      });
    }
  }
}

// 2. ADMIN PANEL -> Add or update "8. Banners & Hero Carousel"
const adminPanel = collection.item.find((i) => i.name === 'ADMIN PANEL');
if (adminPanel) {
  // Remove existing Banners folder if present
  adminPanel.item = adminPanel.item.filter((i) => !i.name.includes('Banners'));

  const bannersAdminFolder = {
    name: '8. Banners & Hero Carousel Management',
    description:
      'Full administrative management for OTT Hero Banners and Carousel slides. Admins can upload 16:9 banners, link to specific drama series, set custom promotional external URLs, reorder display priorities, and toggle active carousel status.',
    item: [
      {
        name: '8.1 List All Banners (Admin Catalog & Stats)',
        request: {
          method: 'GET',
          header: [],
          url: {
            raw: '{{baseUrl}}/home/admin/banners',
            host: ['{{baseUrl}}'],
            path: ['home', 'admin', 'banners']
          },
          description:
            'Retrieves all configured banners (both active and inactive) with linked drama details, full media URLs, and catalog summary statistics.'
        },
        response: []
      },
      {
        name: '8.2 Create New Content Banner',
        request: {
          method: 'POST',
          header: [
            {
              key: 'Content-Type',
              value: 'application/json'
            }
          ],
          body: {
            mode: 'raw',
            raw: JSON.stringify(
              {
                title: 'The Billionaire Secret',
                subtitle: 'Watch all new episodes streaming now in 4K HDR',
                bannerUrl: 'http://localhost:5001/uploads/images/hero_banner.jpg',
                posterUrl: 'http://localhost:5001/uploads/images/poster.jpg',
                trailerUrl: 'http://localhost:5001/uploads/videos/teaser.mp4',
                badge: 'FEATURED',
                linkType: 'DRAMA',
                dramaId: '6ab7a2782b9a6432b168e3e3',
                episodeNumber: 1,
                displayOrder: 1,
                isActive: true
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
            raw: '{{baseUrl}}/home/banners',
            host: ['{{baseUrl}}'],
            path: ['home', 'banners']
          },
          description:
            'Creates a new banner slide. Can be linked to a drama series or external URL, with customizable badge (FEATURED, TOP 10, TRENDING, EXCLUSIVE) and display order.'
        },
        response: []
      },
      {
        name: '8.3 Update Content Banner',
        request: {
          method: 'PATCH',
          header: [
            {
              key: 'Content-Type',
              value: 'application/json'
            }
          ],
          body: {
            mode: 'raw',
            raw: JSON.stringify(
              {
                title: 'The Billionaire Secret — Finale Week',
                subtitle: 'The thrilling season conclusion is now live!',
                badge: 'EXCLUSIVE',
                displayOrder: 1,
                isActive: true
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
            raw: '{{baseUrl}}/home/banners/{{bannerId}}',
            host: ['{{baseUrl}}'],
            path: ['home', 'banners', '{{bannerId}}']
          },
          description: 'Updates banner metadata, title, subtitle, badge, linked drama, or display order.'
        },
        response: []
      },
      {
        name: '8.4 Toggle Banner Active/Inactive Status',
        request: {
          method: 'PATCH',
          header: [],
          url: {
            raw: '{{baseUrl}}/home/admin/banners/{{bannerId}}/toggle',
            host: ['{{baseUrl}}'],
            path: ['home', 'admin', 'banners', '{{bannerId}}', 'toggle']
          },
          description: 'Quickly toggles a banner between active (live on app carousel) and inactive (draft/hidden).'
        },
        response: []
      },
      {
        name: '8.5 Batch Reorder Banners Display Order',
        request: {
          method: 'PATCH',
          header: [
            {
              key: 'Content-Type',
              value: 'application/json'
            }
          ],
          body: {
            mode: 'raw',
            raw: JSON.stringify(
              {
                items: [
                  { id: '{{bannerId}}', displayOrder: 1 }
                ]
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
            raw: '{{baseUrl}}/home/admin/banners/reorder',
            host: ['{{baseUrl}}'],
            path: ['home', 'admin', 'banners', 'reorder']
          },
          description: 'Updates sequence/ordering of banners in the hero carousel.'
        },
        response: []
      },
      {
        name: '8.6 Delete Banner Permanently',
        request: {
          method: 'DELETE',
          header: [],
          url: {
            raw: '{{baseUrl}}/home/banners/{{bannerId}}',
            host: ['{{baseUrl}}'],
            path: ['home', 'banners', '{{bannerId}}']
          },
          description: 'Deletes a banner permanently from the database.'
        },
        response: []
      }
    ]
  };

  adminPanel.item.push(bannersAdminFolder);
}

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf8');
console.log('Postman collection successfully updated with Banner Management APIs!');
