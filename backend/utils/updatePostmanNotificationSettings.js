import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const postmanPath = path.resolve(__dirname, '../../E2_Stories_OTT_Auth_APIs.postman_collection.json');

const raw = fs.readFileSync(postmanPath, 'utf8');
const collection = JSON.parse(raw);

const mobileFolder = collection.item.find((i) => i.name === 'MOBILE APP');
if (!mobileFolder) {
  console.error('MOBILE APP folder not found');
  process.exit(1);
}

const notifFolder = mobileFolder.item.find((i) => i.name.includes('Notifications'));
if (!notifFolder) {
  console.error('Notifications folder not found');
  process.exit(1);
}

// ── Rebuild Notifications Folder Items ──────────────────────────────────────
const existingItems = notifFolder.item;

const item31 = existingItems.find((i) => i.name.includes('3.1 Get Notifications'));
const item32 = existingItems.find((i) => i.name.includes('3.2 Get Unread Count'));
const item33 = existingItems.find((i) => i.name.includes('3.3 Mark Single'));
const item34 = existingItems.find((i) => i.name.includes('3.4 Mark All'));
const item35 = existingItems.find((i) => i.name.includes('3.5 Delete Single'));
const item36 = existingItems.find((i) => i.name.includes('3.6 Clear All'));
const item39Old = existingItems.find((i) => i.name.includes('Register Device Token'));
const item310Old = existingItems.find((i) => i.name.includes('Unregister Device Token'));
const item311Old = existingItems.find((i) => i.name.includes('Seed Sample Notifications'));

const new37 = {
  name: '3.7 Get Notification Settings',
  request: {
    auth: {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{authToken}}', type: 'string' }]
    },
    method: 'GET',
    header: [],
    url: {
      raw: '{{baseUrl}}/notifications/settings',
      host: ['{{baseUrl}}'],
      path: ['notifications', 'settings']
    },
    description:
      'Fetch user alert preferences for the **Notification Settings screen**.\n\nReturns:\n- **title**: "Notification Settings"\n- **subtitle**: "Manage your alert preferences"\n- **category**: "ALERTS"\n- **settings**: `{ newEpisodes: true, newReleases: true, recommendations: false }`\n- **alerts**: Detailed metadata array for toggle items with display titles and subtitles.'
  },
  response: [
    {
      name: '200 Success — Notification Settings & Alerts',
      originalRequest: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/notifications/settings',
          host: ['{{baseUrl}}'],
          path: ['notifications', 'settings']
        }
      },
      status: 'OK',
      code: 200,
      _postman_previewlanguage: 'json',
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: JSON.stringify(
        {
          success: true,
          statusCode: 200,
          message: 'Notification settings fetched successfully',
          data: {
            title: 'Notification Settings',
            subtitle: 'Manage your alert preferences',
            category: 'ALERTS',
            settings: {
              newEpisodes: true,
              newReleases: true,
              recommendations: false
            },
            alerts: [
              {
                key: 'newEpisodes',
                title: 'New episodes',
                description: 'Get notified when a series continues',
                enabled: true
              },
              {
                key: 'newReleases',
                title: 'New releases',
                description: 'Discover newly added series',
                enabled: true
              },
              {
                key: 'recommendations',
                title: 'Recommendations',
                description: 'Personalized stories for you',
                enabled: false
              }
            ]
          }
        },
        null,
        2
      )
    }
  ]
};

const new38 = {
  name: '3.8 Update Notification Settings (PUT & PATCH)',
  request: {
    auth: {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{authToken}}', type: 'string' }]
    },
    method: 'PUT',
    header: [{ key: 'Content-Type', value: 'application/json' }],
    body: {
      mode: 'raw',
      raw: JSON.stringify(
        {
          newEpisodes: true,
          newReleases: true,
          recommendations: false
        },
        null,
        2
      ),
      options: { raw: { language: 'json' } }
    },
    url: {
      raw: '{{baseUrl}}/notifications/settings',
      host: ['{{baseUrl}}'],
      path: ['notifications', 'settings']
    },
    description:
      'Update notification preferences. Accepts full object, partial keys, or single key update `{ "key": "recommendations", "enabled": false }`. Also supports PATCH method.'
  },
  response: [
    {
      name: '200 Success — Notification Settings Updated',
      originalRequest: {
        method: 'PUT',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        url: {
          raw: '{{baseUrl}}/notifications/settings',
          host: ['{{baseUrl}}'],
          path: ['notifications', 'settings']
        }
      },
      status: 'OK',
      code: 200,
      _postman_previewlanguage: 'json',
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: JSON.stringify(
        {
          success: true,
          statusCode: 200,
          message: 'Notification settings updated successfully',
          data: {
            title: 'Notification Settings',
            subtitle: 'Manage your alert preferences',
            settings: {
              newEpisodes: true,
              newReleases: true,
              recommendations: true
            },
            alerts: [
              {
                key: 'newEpisodes',
                title: 'New episodes',
                description: 'Get notified when a series continues',
                enabled: true
              },
              {
                key: 'newReleases',
                title: 'New releases',
                description: 'Discover newly added series',
                enabled: true
              },
              {
                key: 'recommendations',
                title: 'Recommendations',
                description: 'Personalized stories for you',
                enabled: true
              }
            ]
          }
        },
        null,
        2
      )
    }
  ]
};

const new39 = {
  name: '3.9 Toggle Single Notification Setting (PATCH)',
  request: {
    auth: {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{authToken}}', type: 'string' }]
    },
    method: 'PATCH',
    header: [{ key: 'Content-Type', value: 'application/json' }],
    body: {
      mode: 'raw',
      raw: '{\n  "enabled": true\n}',
      options: { raw: { language: 'json' } }
    },
    url: {
      raw: '{{baseUrl}}/notifications/settings/:key/toggle',
      host: ['{{baseUrl}}'],
      path: ['notifications', 'settings', ':key', 'toggle'],
      variable: [
        {
          key: 'key',
          value: 'newEpisodes',
          description: 'Setting key to toggle: newEpisodes | newReleases | recommendations'
        }
      ]
    },
    description:
      'Direct toggle endpoint for switch controls. Inverts the boolean if body is empty, or sets explicit value with `{"enabled": true}` or `{"enabled": false}`. Also supports POST `{{baseUrl}}/notifications/settings/toggle` with body `{"key": "newEpisodes"}`.'
  },
  response: [
    {
      name: '200 Success — Setting Toggled',
      status: 'OK',
      code: 200,
      _postman_previewlanguage: 'json',
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: JSON.stringify(
        {
          success: true,
          statusCode: 200,
          message: "Notification setting 'newEpisodes' set to false",
          data: {
            key: 'newEpisodes',
            enabled: false,
            settings: {
              newEpisodes: false,
              newReleases: true,
              recommendations: false
            },
            alerts: [
              {
                key: 'newEpisodes',
                title: 'New episodes',
                description: 'Get notified when a series continues',
                enabled: false
              },
              {
                key: 'newReleases',
                title: 'New releases',
                description: 'Discover newly added series',
                enabled: true
              },
              {
                key: 'recommendations',
                title: 'Recommendations',
                description: 'Personalized stories for you',
                enabled: false
              }
            ]
          }
        },
        null,
        2
      )
    }
  ]
};

const new310 = {
  name: '3.10 Reset Notification Settings (POST)',
  request: {
    auth: {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{authToken}}', type: 'string' }]
    },
    method: 'POST',
    header: [],
    url: {
      raw: '{{baseUrl}}/notifications/settings/reset',
      host: ['{{baseUrl}}'],
      path: ['notifications', 'settings', 'reset']
    },
    description:
      'Resets all alert toggles back to default platform state:\n- `newEpisodes: true`\n- `newReleases: true`\n- `recommendations: false`'
  },
  response: [
    {
      name: '200 Success — Notification Settings Reset',
      status: 'OK',
      code: 200,
      _postman_previewlanguage: 'json',
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: JSON.stringify(
        {
          success: true,
          statusCode: 200,
          message: 'Notification settings reset to defaults successfully',
          data: {
            settings: {
              newEpisodes: true,
              newReleases: true,
              recommendations: false
            },
            alerts: [
              {
                key: 'newEpisodes',
                title: 'New episodes',
                description: 'Get notified when a series continues',
                enabled: true
              },
              {
                key: 'newReleases',
                title: 'New releases',
                description: 'Discover newly added series',
                enabled: true
              },
              {
                key: 'recommendations',
                title: 'Recommendations',
                description: 'Personalized stories for you',
                enabled: false
              }
            ]
          }
        },
        null,
        2
      )
    }
  ]
};

// Renumber remaining items
if (item39Old) item39Old.name = '3.11 Register Device Token (FCM)';
if (item310Old) item310Old.name = '3.12 Unregister Device Token (FCM)';
if (item311Old) item311Old.name = '3.13 Seed Sample Notifications';

notifFolder.item = [
  item31,
  item32,
  item33,
  item34,
  item35,
  item36,
  new37,
  new38,
  new39,
  new310,
  item39Old,
  item310Old,
  item311Old
].filter(Boolean);

// ── Update Folder 9 (User Library) with GET /user/settings & /user/notification-settings ──
const libraryFolder = mobileFolder.item.find(
  (i) => i.name.includes('Saved Series') || i.name.includes('User Library')
);

if (libraryFolder) {
  // Check if 9.8 is already Get User Playback & App Settings
  const hasGetSettings = libraryFolder.item.some((i) => i.name.includes('Get User Playback'));
  if (!hasGetSettings) {
    const getSettingsItem = {
      name: '9.8 Get User Playback & App Settings',
      request: {
        auth: {
          type: 'bearer',
          bearer: [{ key: 'token', value: '{{authToken}}', type: 'string' }]
        },
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/user/settings',
          host: ['{{baseUrl}}'],
          path: ['user', 'settings']
        },
        description: 'Fetch complete user playback, application, and notification settings.'
      },
      response: []
    };

    const getNotifSettingsItem = {
      name: '9.11 Get User Notification Preferences (Alias)',
      request: {
        auth: {
          type: 'bearer',
          bearer: [{ key: 'token', value: '{{authToken}}', type: 'string' }]
        },
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/user/notification-settings',
          host: ['{{baseUrl}}'],
          path: ['user', 'notification-settings']
        },
        description: 'Fetch alert notification settings via user library alias endpoint.'
      },
      response: []
    };

    // Renumber existing 9.8 and 9.10
    libraryFolder.item.forEach((it) => {
      if (it.name.includes('9.8 Update Playback')) {
        it.name = '9.9 Update Playback & App Settings (PUT)';
      } else if (it.name.includes('9.10 Update Playback')) {
        it.name = '9.10 Update Playback & App Settings (PATCH)';
      }
    });

    libraryFolder.item.splice(7, 0, getSettingsItem);
    libraryFolder.item.push(getNotifSettingsItem);
  }
}

fs.writeFileSync(postmanPath, JSON.stringify(collection, null, 2), 'utf8');
console.log('✅ Postman Collection successfully updated with all Notification Settings screen APIs!');
