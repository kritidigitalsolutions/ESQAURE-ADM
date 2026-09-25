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

ensureVar('sectionId', '', 'MongoDB ObjectId of a Home Category Section');
ensureVar('sectionSlug', 'trending-now', 'Slug of a Home Category Section');

// 1. MOBILE APP -> 7. Home & Discovery Feed
const mobileApp = collection.item.find((i) => i.name === 'MOBILE APP');
if (!mobileApp) {
  console.error('MOBILE APP group not found in collection');
  process.exit(1);
}

// Remove old home folder if present
mobileApp.item = mobileApp.item.filter((i) => !i.name.includes('Home & Discovery'));

const homeMobileFolder = {
  name: '7. Home & Discovery Feed',
  description:
    'APIs powering the OTT Home Screen feed. Includes prioritized content by admin, continue watching row with playback progress, categories ordered by admin priority, recommended categories as genres, new releases, and dynamic admin-configured category sections. All endpoints support standard pagination.',
  item: [
    {
      name: '7.1 All Content by Admin Priority',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/home/content?page=1&limit=10&sortOrder=asc',
          host: ['{{baseUrl}}'],
          path: ['home', 'content'],
          query: [
            {
              key: 'page',
              value: '1',
              description: 'Page number (default: 1)'
            },
            {
              key: 'limit',
              value: '10',
              description: 'Items per page (default: 10, max: 50)'
            },
            {
              key: 'genre',
              value: '',
              description: 'Optional genre ID or slug filter'
            },
            {
              key: 'sortOrder',
              value: 'asc',
              description: "Sorting direction: 'asc' (1, 2, 3... top priority first) or 'desc'"
            }
          ]
        },
        description:
          'Fetches all published drama content ordered by priority set by admin. Dramas with lower priority numbers (1, 2, 3...) appear first, followed by viewsCount and recency. Standard pagination included.'
      },
      response: []
    },
    {
      name: '7.2 Continue Watching',
      request: {
        method: 'GET',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{authToken}}',
            type: 'text',
            description: 'Optional — returns user watch history; graceful empty list for guests'
          }
        ],
        url: {
          raw: '{{baseUrl}}/home/continue-watching?page=1&limit=10',
          host: ['{{baseUrl}}'],
          path: ['home', 'continue-watching'],
          query: [
            {
              key: 'page',
              value: '1',
              description: 'Page number (default: 1)'
            },
            {
              key: 'limit',
              value: '10',
              description: 'Items per page (default: 10)'
            }
          ]
        },
        description:
          'Returns the active Continue Watching row with watch history for the authenticated user (progress < 95%), sorted by lastWatchedAt descending. Includes watched seconds, remaining seconds, duration, progress percentage, episode badge, and drama card. Returns empty list for guests without erroring.'
      },
      response: []
    },
    {
      name: '7.3 All Categories (as per Admin Priority)',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/home/categories?page=1&limit=10&includeDramas=false&dramasLimit=6',
          host: ['{{baseUrl}}'],
          path: ['home', 'categories'],
          query: [
            {
              key: 'page',
              value: '1',
              description: 'Page number (default: 1)'
            },
            {
              key: 'limit',
              value: '10',
              description: 'Categories per page (default: 10)'
            },
            {
              key: 'includeDramas',
              value: 'false',
              description: 'Set to true to embed a preview tray of top dramas for each category'
            },
            {
              key: 'dramasLimit',
              value: '6',
              description: 'Number of sample dramas per category when includeDramas=true'
            }
          ]
        },
        description:
          'Fetches all active OTT genres/categories strictly ordered by admin displayOrder (priority). Returns category details, icon URLs, published drama count, and optional top drama cards. Standard pagination included.'
      },
      response: []
    },
    {
      name: '7.4 Recommended Categories as Genres',
      request: {
        method: 'GET',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{authToken}}',
            type: 'text',
            description: 'Optional — personalizes categories based on profile build interests'
          }
        ],
        url: {
          raw: '{{baseUrl}}/home/recommended-categories?page=1&limit=10&includeDramas=true&dramasLimit=6',
          host: ['{{baseUrl}}'],
          path: ['home', 'recommended-categories'],
          query: [
            {
              key: 'page',
              value: '1',
              description: 'Page number (default: 1)'
            },
            {
              key: 'limit',
              value: '10',
              description: 'Categories per page (default: 10)'
            },
            {
              key: 'includeDramas',
              value: 'true',
              description: 'Embeds top preview dramas for each recommended category'
            },
            {
              key: 'dramasLimit',
              value: '6',
              description: 'Max dramas to return inside each category tray'
            }
          ]
        },
        description:
          'Recommends categories as genres. Prioritizes genres chosen during profile onboarding (user.interests, tagged isUserInterest: true), followed by top-performing genres ranked by views and admin priority. Returns category details and preview drama cards. Standard pagination included.'
      },
      response: []
    },
    {
      name: '7.5 New Releases Section',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/home/new-releases?page=1&limit=10',
          host: ['{{baseUrl}}'],
          path: ['home', 'new-releases'],
          query: [
            {
              key: 'page',
              value: '1',
              description: 'Page number (default: 1)'
            },
            {
              key: 'limit',
              value: '10',
              description: 'Items per page (default: 10)'
            },
            {
              key: 'genre',
              value: '',
              description: 'Optional genre filter ID or slug'
            }
          ]
        },
        description:
          'Fetches the New Releases section for the Home screen. Returns chronologically sorted latest published dramas (prioritizing isNewRelease: true) with release date, views count formatted, and ratings. Standard pagination included.'
      },
      response: []
    },
    {
      name: '7.6 Dynamic Home Category Sections',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/home/sections?page=1&limit=10',
          host: ['{{baseUrl}}'],
          path: ['home', 'sections'],
          query: [
            {
              key: 'page',
              value: '1',
              description: 'Page number (default: 1)'
            },
            {
              key: 'limit',
              value: '10',
              description: 'Sections per page (default: 10)'
            }
          ]
        },
        description:
          'Fetches all active home category sections dynamically configured and prioritized by admin. Automatically resolves and embeds dramas for each section based on its sectionType (GENRE, CUSTOM_CURATED, NEW_RELEASES, TRENDING, PRIORITY_CONTENT). Standard pagination included.'
      },
      response: []
    },
    {
      name: '7.7 View All Section Content',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/home/sections/{{sectionSlug}}?page=1&limit=10',
          host: ['{{baseUrl}}'],
          path: ['home', 'sections', '{{sectionSlug}}'],
          query: [
            {
              key: 'page',
              value: '1',
              description: 'Page number (default: 1)'
            },
            {
              key: 'limit',
              value: '10',
              description: 'Items per page (default: 10)'
            }
          ]
        },
        description:
          'View All screen for a specific home category section (by ID or slug). Returns paginated list of all drama cards belonging to that section.'
      },
      response: []
    },
    {
      name: '7.8 Unified Home Screen Feed',
      request: {
        method: 'GET',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{authToken}}',
            type: 'text',
            description: 'Optional — personalizes feed and loads continue watching'
          }
        ],
        url: {
          raw: '{{baseUrl}}/home/feed',
          host: ['{{baseUrl}}'],
          path: ['home', 'feed']
        },
        description:
          'Single pre-aggregated API for the entire mobile Home screen. Loads Hero Carousel, Continue Watching, Categories pills, Admin Prioritized Content, New Releases, and Dynamic Category Sections in one lightning-fast request.'
      },
      response: []
    }
  ]
};

mobileApp.item.push(homeMobileFolder);

// 2. ADMIN PANEL -> 7. Home Category Sections & Content Priority
const adminPanel = collection.item.find((i) => i.name === 'ADMIN PANEL');
if (!adminPanel) {
  console.error('ADMIN PANEL group not found in collection');
  process.exit(1);
}

// Remove old admin section folder if present
adminPanel.item = adminPanel.item.filter((i) => !i.name.includes('Home Category Sections'));

const homeAdminFolder = {
  name: '7. Home Category Sections & Content Priority',
  description:
    'Admin panel management APIs for Home Page Category Sections and Content Priority ordering. Admin can create new custom sections (genre-based, custom curated, trending, new releases), set display priorities, toggle visibility, and assign drama priority scores.',
  item: [
    {
      name: '7.1 Add New Category Section on Home Page',
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
              title: 'Trending Romantic Stories',
              subtitle: 'Top romance micro-dramas of the month',
              slug: 'trending-romance',
              sectionType: 'GENRE',
              genreId: '66e11ad9cf366676cc944b71',
              layout: 'HORIZONTAL_CARD',
              displayOrder: 1,
              maxItems: 10,
              viewAllEnabled: true,
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
          raw: '{{baseUrl}}/home/admin/sections',
          host: ['{{baseUrl}}'],
          path: ['home', 'admin', 'sections']
        },
        description:
          'Allows admin to add a new category section on the mobile home page. Section types: GENRE (pulls dramas by genre), CUSTOM_CURATED (admin selects specific drama IDs), NEW_RELEASES, TRENDING, PRIORITY_CONTENT. Lower displayOrder indicates higher priority.'
      },
      response: []
    },
    {
      name: '7.2 List All Home Category Sections',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/home/admin/sections?page=1&limit=20&status=ALL',
          host: ['{{baseUrl}}'],
          path: ['home', 'admin', 'sections'],
          query: [
            {
              key: 'page',
              value: '1',
              description: 'Page number'
            },
            {
              key: 'limit',
              value: '20',
              description: 'Items per page'
            },
            {
              key: 'search',
              value: '',
              description: 'Search by section title or slug'
            },
            {
              key: 'status',
              value: 'ALL',
              description: 'Filter by status: ALL | ACTIVE | INACTIVE'
            }
          ]
        },
        description:
          'Retrieves all configured home page category sections sorted by displayOrder (priority) for the admin table, with search and pagination.'
      },
      response: []
    },
    {
      name: '7.3 Get Single Home Section Details',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/home/admin/sections/{{sectionId}}',
          host: ['{{baseUrl}}'],
          path: ['home', 'admin', 'sections', '{{sectionId}}']
        },
        description: 'Get full configuration and details of a single home category section.'
      },
      response: []
    },
    {
      name: '7.4 Update Home Category Section',
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
              title: 'Top Romantic Stories',
              subtitle: 'Curated love stories for your evening',
              displayOrder: 2,
              maxItems: 12,
              layout: 'HORIZONTAL_CARD'
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
          raw: '{{baseUrl}}/home/admin/sections/{{sectionId}}',
          host: ['{{baseUrl}}'],
          path: ['home', 'admin', 'sections', '{{sectionId}}']
        },
        description:
          'Update any section parameters: title, subtitle, slug, sectionType, genreId, dramaIds, layout, displayOrder, maxItems, isActive.'
      },
      response: []
    },
    {
      name: '7.5 Batch Reorder Section Display Priorities',
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
                { id: '66e11ad9cf366676cc944b71', displayOrder: 1 },
                { id: '66e11ad9cf366676cc944b72', displayOrder: 2 },
                { id: '66e11ad9cf366676cc944b73', displayOrder: 3 }
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
          raw: '{{baseUrl}}/home/admin/sections/reorder',
          host: ['{{baseUrl}}'],
          path: ['home', 'admin', 'sections', 'reorder']
        },
        description:
          'Allows drag-and-drop priority reordering of home sections in the admin CMS table.'
      },
      response: []
    },
    {
      name: '7.6 Toggle Section Active/Inactive Status',
      request: {
        method: 'PATCH',
        header: [],
        url: {
          raw: '{{baseUrl}}/home/admin/sections/{{sectionId}}/toggle',
          host: ['{{baseUrl}}'],
          path: ['home', 'admin', 'sections', '{{sectionId}}', 'toggle']
        },
        description:
          'Instantly toggles a home section between active (visible on home screen) and inactive (hidden).'
      },
      response: []
    },
    {
      name: '7.7 Delete Home Category Section',
      request: {
        method: 'DELETE',
        header: [],
        url: {
          raw: '{{baseUrl}}/home/admin/sections/{{sectionId}}',
          host: ['{{baseUrl}}'],
          path: ['home', 'admin', 'sections', '{{sectionId}}']
        },
        description: 'Permanently deletes a category section from the home page configuration.'
      },
      response: []
    },
    {
      name: '7.8 Set Individual Drama Priority Score',
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
              priority: 1
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
          raw: '{{baseUrl}}/home/admin/dramas/{{dramaId}}/priority',
          host: ['{{baseUrl}}'],
          path: ['home', 'admin', 'dramas', '{{dramaId}}', 'priority']
        },
        description:
          'Allows admin to set priority score for any drama series (e.g. 1 for highest placement). Directly influences the "All Content by Admin Priority" feed.'
      },
      response: []
    }
  ]
};

adminPanel.item.push(homeAdminFolder);

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf8');
console.log('Postman collection successfully updated with Home Feed and Admin Section APIs!');
