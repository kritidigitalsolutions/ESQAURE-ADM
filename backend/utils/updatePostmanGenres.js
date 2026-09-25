import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const collectionPath = path.resolve(__dirname, '../../E2_Stories_OTT_Auth_APIs.postman_collection.json');

const raw = fs.readFileSync(collectionPath, 'utf8');
const collection = JSON.parse(raw);

// Ensure collection variables
const ensureVar = (key, value, description) => {
  if (!collection.variable.some((v) => v.key === key)) {
    collection.variable.push({
      key,
      value,
      type: 'string',
      description
    });
  }
};

ensureVar('genreId', '', 'MongoDB ObjectId of a Genre category');
ensureVar('genreSlug', 'romance', 'Slug of a Genre category');

// 1. MOBILE APP -> Add / Update Genres folder
const mobileApp = collection.item.find((i) => i.name === 'MOBILE APP');
if (mobileApp) {
  // Remove existing if any
  mobileApp.item = mobileApp.item.filter((i) => !i.name.includes('Genres & Categories'));
  const genreMobileFolder = {
    name: '8. Genres & Categories',
    description: 'Public and onboarding endpoints for fetching genres and interest categories with real-time drama counts.',
    item: [
      {
        name: '8.1 Get Active Genres with Drama Counts',
        request: {
          method: 'GET',
          header: [],
          url: {
            raw: '{{baseUrl}}/genres',
            host: ['{{baseUrl}}'],
            path: ['genres']
          },
          description: 'Fetch all active genres configured for catalog browsing and interest selection.'
        },
        response: []
      },
      {
        name: '8.2 Get Genre Details with Associated Dramas',
        request: {
          method: 'GET',
          header: [],
          url: {
            raw: '{{baseUrl}}/genres/{{genreId}}',
            host: ['{{baseUrl}}'],
            path: ['genres', '{{genreId}}']
          },
          description: 'Fetch detailed single genre metadata along with all linked drama series.'
        },
        response: []
      }
    ]
  };
  mobileApp.item.push(genreMobileFolder);
}

// 2. ADMIN PANEL -> 8. Genres & Categories Management
const adminPanel = collection.item.find((i) => i.name === 'ADMIN PANEL');
if (adminPanel) {
  adminPanel.item = adminPanel.item.filter((i) => !i.name.includes('Genres & Categories'));
  const genreAdminFolder = {
    name: '8. Genres & Categories Management',
    description: 'Admin APIs for full dynamic CRUD management of genres and categories, real-time drama count aggregation, custom color badges, icon selection, and active visibility toggle.',
    item: [
      {
        name: '8.1 Get All Genres with Live Metrics (Admin)',
        request: {
          method: 'GET',
          header: [],
          url: {
            raw: '{{baseUrl}}/genres/admin',
            host: ['{{baseUrl}}'],
            path: ['genres', 'admin']
          },
          description: 'Fetches all genres (both active and hidden) with aggregated dramaCount from Drama collection and high-level KPIs.'
        },
        response: []
      },
      {
        name: '8.2 Create New Genre Category',
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
                name: 'Sci-Fi & Cyberpunk',
                slug: 'scifi-cyberpunk',
                icon: 'Sparkles',
                color: '#8B5CF6',
                displayOrder: 9,
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
            raw: '{{baseUrl}}/genres',
            host: ['{{baseUrl}}'],
            path: ['genres']
          },
          description: 'Creates a new genre with custom icon, accent color, and auto-generated slug.'
        },
        response: []
      },
      {
        name: '8.3 Update Existing Genre Category',
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
                name: 'Romantic Suspense',
                icon: 'Heart',
                color: '#EC4899',
                isActive: true,
                displayOrder: 1
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
            raw: '{{baseUrl}}/genres/{{genreId}}',
            host: ['{{baseUrl}}'],
            path: ['genres', '{{genreId}}']
          },
          description: 'Updates genre name, slug, icon, color, or priority display order.'
        },
        response: []
      },
      {
        name: '8.4 Toggle Genre Active Status',
        request: {
          method: 'PATCH',
          header: [],
          url: {
            raw: '{{baseUrl}}/genres/{{genreId}}/toggle-active',
            host: ['{{baseUrl}}'],
            path: ['genres', '{{genreId}}', 'toggle-active']
          },
          description: 'Instantly switches genre between ACTIVE and HIDDEN in catalog.'
        },
        response: []
      },
      {
        name: '8.5 Delete Genre (Safe Unlink)',
        request: {
          method: 'DELETE',
          header: [],
          url: {
            raw: '{{baseUrl}}/genres/{{genreId}}',
            host: ['{{baseUrl}}'],
            path: ['genres', '{{genreId}}']
          },
          description: 'Permanently deletes genre and safely unlinks its reference from all drama series.'
        },
        response: []
      }
    ]
  };
  adminPanel.item.push(genreAdminFolder);
}

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf8');
console.log('Postman collection updated successfully with Genres & Categories APIs!');
