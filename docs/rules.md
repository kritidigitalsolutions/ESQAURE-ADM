# Development & Engineering Rules
## Project: E² Stories (Entertainment Squared) — Backend & Admin Panel

---

## 1. Codebase Architecture & Conventions

### 1.1 Technology Guidelines
- **Runtime**: Node.js v20+ LTS with Modern JavaScript (ES Modules: `"type": "module"` in `package.json`).
- **Database**: MongoDB with Mongoose ODM.
- **Admin Panel**: React.js (Vite) + Tailwind CSS + Lucide React.
- **No TypeScript**: The codebase is strictly standard JavaScript (ES6+) with clear JSDoc comments where helpful.

### 1.2 Backend Directory Structure
```
backend/
├── config/             # DB connection, redis client, environment variables
├── constants/          # Error codes, status strings, regex patterns
├── controllers/        # Request handlers (lean controllers, extract params)
├── middlewares/        # Auth, error handling, rate limiting, validation
├── models/             # Mongoose schemas & model definitions
├── routes/             # Express route declarations (grouped by resource)
├── services/           # Business logic, 3rd party APIs (Razorpay, SMS, S3)
├── utils/              # Helper functions, logger, response envelope
├── validations/        # Request schema validation (Joi or Zod)
├── app.js              # Express app setup & middleware chaining
└── server.js           # Server listen & graceful shutdown hooks
```

### 1.3 Admin Panel Directory Structure
```
admin/
├── public/
├── src/
│   ├── assets/         # Logos, icons, styles
│   ├── components/     # Reusable UI elements (charts, common, forms, modals, tables)
│   ├── context/        # AuthContext, ThemeContext
│   ├── hooks/          # Custom hooks (useAuth, useFetch, useDebounce)
│   ├── layouts/        # DashboardLayout, AuthLayout, Navbar, Sidebar
│   ├── pages/          # Overview, Dramas, Episodes, Users, Subscriptions, Audit, Settings
│   ├── services/           # Axios API client & endpoint helpers
│   ├── utils/              # Formatters (currency, dates, duration)
│   ├── App.jsx             # Main Router & Route Guards
│   └── main.jsx            # React root mount
```

---

## 2. API Design & Contract Standards

### 2.1 Standardized Response Envelope
All API endpoints must return a predictable, uniform JSON structure:

#### Success Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dramas retrieved successfully",
  "data": {
    "items": [ /* list of objects */ ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 8,
      "totalCount": 78,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### Error Response:
```json
{
  "success": false,
  "statusCode": 403,
  "error": "VIP_REQUIRED",
  "message": "Premium membership is required to unlock this episode."
}
```

### 2.2 HTTP Status Code Usage
- `200 OK`: Successful GET, PUT, PATCH.
- `201 Created`: Successful POST entity creation.
- `400 Bad Request`: Client input validation error (missing/invalid fields).
- `401 Unauthorized`: Missing, expired, or invalid JWT.
- `403 Forbidden`: Authenticated user lacks permission (e.g. Free user trying to stream VIP episode).
- `404 Not Found`: Resource does not exist.
- `429 Too Many Requests`: Rate limit reached (e.g., OTP flood limit).
- `500 Internal Server Error`: Uncaught server exception.

### 2.3 Pagination & Filtering Conventions
- Query parameters must use standard names:
  - `page`: 1-based integer index (default `1`).
  - `limit`: Number of items per page (default `10`, max `50`).
  - `sort`: Field name with optional `-` prefix for descending (e.g. `-createdAt`, `viewsCount`).
  - `search` or `q`: Keyword search string.
  - `genre`: Comma-separated genre slugs.

---

## 3. Security & Data Protection Rules

### 3.1 Authentication & Tokens
- **Mobile Client**: JWT stored securely on client; sent via `Authorization: Bearer <token>` header.
  - Access Token TTL: `7 days` (sliding refresh on user activity).
- **Admin Panel**: Secure `httpOnly`, `sameSite: 'strict'`, `secure: true` cookie or encrypted session token.
  - Session TTL: `8 hours` of inactivity.
- **Admin Password Storage**: Always hash using `bcryptjs` with a minimum salt factor of `12`.

### 3.2 Rate Limiting & Abuse Prevention
- **OTP Generation**: Strict throttling using Redis:
  - Max 1 request per 60 seconds per phone number.
  - Max 3 requests per 10 minutes per IP address.
  - Max 5 failed verification attempts before 15-minute lockout.
- **Global API Rate Limit**: `100 requests per minute` per IP using `express-rate-limit`.

### 3.3 Injection & Parameter Tampering
- Sanitize all incoming query and body payloads using `express-mongo-sanitize` to strip `$` and `.` operators.
- Validate all incoming ObjectIds with `mongoose.Types.ObjectId.isValid()`.
- Enable secure HTTP headers via `helmet()`.
- Explicit CORS whitelist allowing only the official mobile bundle IDs and admin dashboard origin.

### 3.4 Payment Webhook Verification
- Never trust client-reported payment success.
- **Mandatory Webhook Verification**: Compute SHA256 HMAC of the raw webhook payload against `RAZORPAY_WEBHOOK_SECRET`.
- Only grant VIP membership upon successful webhook validation or verified signature check on `/verify-payment`.

---

## 4. Error Handling & Operational Rules

### 4.1 Custom `AppError` Pattern
Always throw derived operational errors rather than generic JS errors:
```javascript
export class AppError extends Error {
  constructor(message, statusCode, errorCode = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### 4.2 Centralized Error Middleware
All errors propagate to a single centralized Express middleware (`errorHandler.js`):
- Log stack trace only in development/staging.
- Send human-readable messages in production without exposing sensitive internals.

---

## 5. Performance & Caching Rules

1. **Redis Caching for Heavy Reads**:
   - Cache the `/feed/home` and `/feed/trending` payloads with a `5-minute TTL`.
   - Invalidate or bust cache automatically whenever a Drama or Episode is published or reordered in the Admin Panel.
2. **Lean MongoDB Queries**:
   - Use `.lean()` on all read-only Mongoose queries to bypass heavy document overhead.
   - Use `.select()` to project only required fields (e.g. Do not include heavy video URLs in list cards).
3. **Database Indexing**:
   - Every queried foreign key must be indexed: `dramaId`, `userId`, `isVip`, `isTrending`.
   - Compound indices on `(userId, dramaId)` for instant watchlist and history lookup.
