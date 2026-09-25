import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const collectionPath = path.resolve(__dirname, '../../E2_Stories_OTT_Auth_APIs.postman_collection.json');

const raw = fs.readFileSync(collectionPath, 'utf8');
const collection = JSON.parse(raw);

// 1. Ensure collection variables
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

ensureVar('searchQuery', 'Promise', 'Query string for search testing');

// 2. Mobile App -> 6. Search & Discovery
const mobileApp = collection.item.find((i) => i.name === 'MOBILE APP');
if (!mobileApp) {
  console.error('MOBILE APP group not found in collection');
  process.exit(1);
}

// Remove old search folder if present to recreate freshly
mobileApp.item = mobileApp.item.filter((i) => !i.name.includes('Search'));

const searchFolder = {
  name: '6. Search & Discovery',
  description:
    'Search screen discovery and query APIs matching the mobile UI. Includes ranked Popular Searches (01, 02, 03...), Recommended For You personalized as per genre(s) selected in user profile build (user.interests), live autocomplete suggestions, and multi-field search. Strictly NO recent search history.',
  item: [
    {
      name: '6.1 Search Landing Screen (Popular & Recommended)',
      request: {
        method: 'GET',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{authToken}}',
            type: 'text',
            description: 'Optional — provides personalized recommendations based on profile genres'
          }
        ],
        url: {
          raw: '{{baseUrl}}/search/landing?popularLimit=10&recommendedLimit=10',
          host: ['{{baseUrl}}'],
          path: ['search', 'landing'],
          query: [
            {
              key: 'popularLimit',
              value: '10',
              description: 'Number of popular searches (defaults to 10)'
            },
            {
              key: 'recommendedLimit',
              value: '10',
              description: 'Number of recommended dramas (defaults to 10)'
            }
          ]
        },
        description:
          'Retrieves complete initial search discovery screen data before typing. Returns ranked Popular Searches (01, 02, 03...) and Recommended For You based on genres selected during user profile build (user.interests). Seamless fallback to top trending dramas for guests. Strictly NO recent searches.'
      },
      response: []
    },
    {
      name: '6.2 Popular Searches (Ranked 01..N)',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/search/popular?limit=10',
          host: ['{{baseUrl}}'],
          path: ['search', 'popular'],
          query: [
            {
              key: 'limit',
              value: '10',
              description: 'Limit count (defaults to 10, max 30)'
            }
          ]
        },
        description:
          'Ranked list of popular searches with 2-digit rank badges (01, 02, 03...), poster thumbnail, views count formatted (e.g. 3.5k), and drama details.'
      },
      response: []
    },
    {
      name: '6.3 Recommended For You (Personalized by Profile Genres)',
      request: {
        method: 'GET',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{authToken}}',
            type: 'text',
            description: 'Optional — personalizes based on user.interests'
          }
        ],
        url: {
          raw: '{{baseUrl}}/search/recommended?page=1&limit=10',
          host: ['{{baseUrl}}'],
          path: ['search', 'recommended'],
          query: [
            {
              key: 'page',
              value: '1',
              description: 'Page number'
            },
            {
              key: 'limit',
              value: '10',
              description: 'Results per page'
            }
          ]
        },
        description:
          'Dramas recommended according to the genres chosen by the user in profile build (user.interests). Seamless fallback to top-rated / trending dramas if no genres selected or user is guest.'
      },
      response: []
    },
    {
      name: '6.4 Fast Live Autocomplete Suggestions',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/search/suggestions?q=Sec&limit=8',
          host: ['{{baseUrl}}'],
          path: ['search', 'suggestions'],
          query: [
            {
              key: 'q',
              value: 'Sec',
              description: 'Live query text'
            },
            {
              key: 'limit',
              value: '8',
              description: 'Maximum suggestions'
            }
          ]
        },
        description:
          'Instant autocomplete suggestions returning matching drama titles and matching genres as the user types in the search bar.'
      },
      response: []
    },
    {
      name: '6.5 Multi-Field Search Query',
      request: {
        method: 'GET',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{authToken}}',
            type: 'text',
            description: 'Optional'
          }
        ],
        url: {
          raw: '{{baseUrl}}/search?q={{searchQuery}}&sortBy=relevance&page=1&limit=10',
          host: ['{{baseUrl}}'],
          path: ['search'],
          query: [
            {
              key: 'q',
              value: '{{searchQuery}}',
              description: 'Search term (matches title, synopsis, tags, genres)'
            },
            {
              key: 'sortBy',
              value: 'relevance',
              description: 'Sort order: relevance | popular | latest | rating'
            },
            {
              key: 'page',
              value: '1',
              description: 'Page number'
            },
            {
              key: 'limit',
              value: '10',
              description: 'Results per page'
            }
          ]
        },
        description:
          'Executes multi-field search across titles, synopsis, tags, and matching genres with pagination.'
      },
      response: []
    },
    {
      name: '6.6 Unified Search Route (Empty Query Defaults to Landing)',
      request: {
        method: 'GET',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{authToken}}',
            type: 'text',
            description: 'Optional'
          }
        ],
        url: {
          raw: '{{baseUrl}}/search',
          host: ['{{baseUrl}}'],
          path: ['search']
        },
        description:
          'Unified search endpoint. When query parameter q is omitted or empty, automatically serves the Search Landing Screen discovery data.'
      },
      response: []
    }
  ]
};

mobileApp.item.push(searchFolder);

// 3. Shared -> 8. Legal & Compliance
const shared = collection.item.find((i) => i.name === 'SHARED');
if (shared) {
  shared.item = shared.item.filter((i) => !i.name.includes('Legal'));

  const legalFolder = {
    name: '8. Legal & Compliance',
    description:
      'Public & Admin Legal document APIs (Privacy Policy, Terms & Conditions, Refund Policy, Grievance Redressal statutory compliance).',
    item: [
      {
        name: '8.1 Get All Active Legal Documents',
        request: {
          method: 'GET',
          header: [],
          url: {
            raw: '{{baseUrl}}/legal?includeContent=true',
            host: ['{{baseUrl}}'],
            path: ['legal'],
            query: [
              {
                key: 'includeContent',
                value: 'true',
                description: 'Include full markdown text'
              }
            ]
          },
          description: 'Returns all active legal documents with summaries and optional markdown content.'
        },
        response: []
      },
      {
        name: '8.2 Get Single Legal Doc by Slug',
        request: {
          method: 'GET',
          header: [],
          url: {
            raw: '{{baseUrl}}/legal/privacy-policy',
            host: ['{{baseUrl}}'],
            path: ['legal', 'privacy-policy']
          },
          description: 'Retrieves full markdown text and metadata for a specific legal policy.'
        },
        response: []
      },
      {
        name: '8.3 Get Grievance & Compliance Officer',
        request: {
          method: 'GET',
          header: [],
          url: {
            raw: '{{baseUrl}}/legal/compliance/grievance',
            host: ['{{baseUrl}}'],
            path: ['legal', 'compliance', 'grievance']
          },
          description: 'Returns statutory Grievance Redressal Officer details under Indian IT Rules 2021.'
        },
        response: []
      },
      {
        name: '8.4 [Admin] List All Legal Documents (Active + Inactive)',
        request: {
          method: 'GET',
          header: [],
          url: {
            raw: '{{baseUrl}}/legal/admin/all',
            host: ['{{baseUrl}}'],
            path: ['legal', 'admin', 'all']
          },
          description: 'List all legal policies including active/inactive status and version histories.'
        },
        response: []
      },
      {
        name: '8.5 [Admin] Upsert Legal Policy Document',
        request: {
          method: 'PUT',
          header: [{ key: 'Content-Type', value: 'application/json' }],
          body: {
            mode: 'raw',
            raw: JSON.stringify(
              {
                title: 'Privacy Policy',
                content: '# Privacy Policy\n\nUpdated privacy terms...',
                summary: 'Protects user data and privacy.',
                version: 'v2.1',
                effectiveDate: new Date().toISOString()
              },
              null,
              2
            )
          },
          url: {
            raw: '{{baseUrl}}/legal/admin/privacy-policy',
            host: ['{{baseUrl}}'],
            path: ['legal', 'admin', 'privacy-policy']
          },
          description: 'Create or update a legal policy document.'
        },
        response: []
      },
      {
        name: '8.6 [Admin] Seed Default Legal Policies',
        request: {
          method: 'POST',
          header: [{ key: 'Content-Type', value: 'application/json' }],
          body: {
            mode: 'raw',
            raw: '{\n  "force": false\n}'
          },
          url: {
            raw: '{{baseUrl}}/legal/admin/seed',
            host: ['{{baseUrl}}'],
            path: ['legal', 'admin', 'seed']
          },
          description: 'Initializes or restores standard OTT legal policies.'
        },
        response: []
      }
    ]
  };

  shared.item.push(legalFolder);
}

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf8');
console.log('Postman collection successfully updated with Search & Discovery and Legal & Compliance APIs!');
