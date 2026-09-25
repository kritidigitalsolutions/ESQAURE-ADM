# Postman Collection Maintenance Rule

## Core Rule
Whenever any backend API route or controller is created, updated, or removed:
1. **Always update `E2_Stories_OTT_Auth_APIs.postman_collection.json`** immediately.
2. Ensure new endpoints are properly placed into their corresponding folder:
   - `MOBILE APP`: Endpoints consumed by the mobile client app (Authentication, Profile & Onboarding, Notifications, Subscriptions, Video Player & Content, Search & Discovery, etc.).
   - `ADMIN PANEL`: Endpoints consumed by the CMS Admin dashboard (User Management, Push Notifications & Announcements, Subscription Management, etc.).
   - `SHARED`: Uploads, System Health, Legal & Compliance documents.
3. Include proper query parameters, headers (such as `Authorization: Bearer {{authToken}}`), request bodies, and descriptive Markdown documentation explaining expected request and response payloads.
4. Keep the helper script `backend/utils/updatePostmanCollection.js` up to date to automate or re-sync changes reliably.
