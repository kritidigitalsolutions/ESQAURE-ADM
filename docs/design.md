# Admin Panel UI/UX Design System & Specifications
## Project: E² Stories (Entertainment Squared) — Web Admin Dashboard

---

## 1. Visual Identity & Aesthetic Philosophy

The **E² Stories Admin Panel** is designed as a sleek, high-precision, desktop-first SaaS workstation for content operations, media managers, and platform administrators.

### Core Design References:
- **Typography & Font**: **Urbanist** (clean, geometric modern sans-serif, as referenced in `ui SS/66e11ad9cf366676cc944b715f9a59f3.webp`).
- **Layout & Information Architecture**: Inspired by the **Nodus** modern analytics dashboard (as referenced in `ui SS/76acc4e04f1465ab59eb0e7c889e3300.webp`).
- **Brand Motifs**: Dark luxury theme matching the E² Stories golden/crimson mobile brand, contrasted with hyper-legible neutral backgrounds and glowing neon purple and lime accents.

---

## 2. Design System & Tokens

### 2.1 Color Palette

```
/* Base Backgrounds & Surfaces (Material Design 2 Elevation Model) */
--bg-canvas:          #F8F9FC;      /* Light surface mode */
--bg-surface:         #FFFFFF;      /* Clean card surface */

--bg-canvas-dark:     #080B08;      /* Deep dark slate/charcoal (0dp base canvas, never pure #000000) */
--bg-surface-01dp:    #121612;      /* Level 1: Cards, table rows, input containers (5% overlay) */
--bg-surface-02dp:    #161B16;      /* Level 2: Elevated/hovered cards, widgets (7% overlay) */
--bg-surface-04dp:    #1A1F1A;      /* Level 4: App bars, sticky page headers (9% overlay) */
--bg-surface-08dp:    #202620;      /* Level 8: Menus, dropdowns, filter popovers (12% overlay) */
--bg-surface-16dp:    #242A24;      /* Level 16: Slide-over navigation drawers (15% overlay) */
--bg-surface-24dp:    #282E28;      /* Level 24: Modals, confirmation dialogs (16% overlay) */

--border-subtle-dark: rgba(255, 255, 255, 0.10); /* 10% white divider/border */
--border-focus-dark:  rgba(254, 240, 138, 0.40); /* Theme accent focus ring */

/* Accent & Brand Colors */
--color-brand-primary:   #FEF08A;  /* Brand Primary Pastel Yellow (buttons, active tabs, KPI badges) */
--color-brand-primary-h: #FDE047;  /* Hover state for primary buttons */
--color-brand-secondary: #8FFE01;  /* Neon Lime (positive growth, active status, badges) */
--color-brand-accent:    #E50914;  /* E² Crimson Red (critical actions, play badges) */
--color-gold-accent:     #E5A93C;  /* E² Stories Gold (Subscription status highlight) */

/* Text & "On-Surface" Neutrals (WCAG AA Compliant) */
--text-primary:          #0F172A;      /* Dark text on light mode */
--text-secondary:        #64748B;      /* Muted subtitles light mode */

--text-high-dark:        rgba(255, 255, 255, 0.90); /* 87-90% White: High emphasis titles, headers (≥15.8:1) */
--text-med-dark:         rgba(255, 255, 255, 0.60); /* 60% White: Medium emphasis body, descriptions (≥4.5:1) */
--text-disabled-dark:    rgba(255, 255, 255, 0.38); /* 38% White: Disabled text, placeholders */

/* Functional States */
--status-success:        #10B981;      /* Published / Payment Verified */
--status-warning:        #F59E0B;      /* Draft / Pending Verification */
--status-danger:         #EF4444;      /* Suspended / Failed Payment */
```

### 2.2 Typography Scale
- **Font Family**: `'Urbanist', -apple-system, BlinkMacSystemFont, sans-serif`
- **Display 1**: `48px / 1.1 / Bold (700)` — Big metric counters (e.g. `1,395 Subscribers`)
- **Heading 1**: `28px / 1.2 / SemiBold (600)` — Page titles (e.g. `Auditlog Overview`, `Drama Library`)
- **Heading 2**: `20px / 1.3 / SemiBold (600)` — Section headers & modal titles
- **Body Regular**: `14px / 1.5 / Regular (400)` — Table cells & body copy
- **Caption / Label**: `12px / 1.4 / Medium (500)` — Badges, filter chips, timestamps

### 2.3 Material Design 2 Dark Theme Architecture (UI Application Rules)
Following [Material Design 2 Dark Theme Guidelines](https://m2.material.io/design/color/dark-theme.html#ui-application):

1. **Elevation via Surface Lightness**:
   - Depth is communicated in dark mode through progressively lighter surface tones rather than solely through cast shadows.
   - White semi-transparent overlays are applied above the dark base: 0dp (0%), 1dp (5%), 2dp (7%), 4dp (9%), 8dp (12%), 16dp (15%), 24dp (16%).
   - Cast shadows along the z-axis (`shadow-md`, `shadow-xl`) remain active to delineate overlapping surfaces. Never use colored glowing halos as substitutes for shadows.
2. **Surface Purity vs. Glare**:
   - Avoid pure `#000000` for surface fills. Dark grey/slate (`#080B08` to `#121612`) mitigates eye strain and allows elevation tiers to be visually discernible.
3. **Accent Restraint**:
   - Saturated colors must not dominate large surface areas. 90%+ of UI real estate consists of dark surfaces.
   - Primary `#FEF08A` is reserved for high-impact focal points (CTA buttons, active navigation, active filters, KPI badges).
   - Elevation white overlays are **never** applied to primary-accented surfaces.
4. **Legibility & Contrast Hierarchy**:
   - High-emphasis text: 87–90% opacity white (`text-white/90` or `text-slate-100`).
   - Medium-emphasis text: 60% opacity white (`text-white/60` or `text-slate-400`).
   - Disabled / Placeholders: 38% opacity white (`text-white/38` or `text-slate-500`).
   - Dividers & borders: 10–12% opacity white (`border-white/10`).

---

## 3. Layout Structure & Navigation

Following the Nodus architecture (`ui SS/76acc4e04f1465ab59eb0e7c889e3300.webp`):

```
+-----------------------------------------------------------------------------------------------+
| [E² Logo]   [Summary]  [Auditlog]  [Dramas]  [Episodes]  [Users]  [Revenue] | [Admin: Greg B v] [O] |
+-----------------------------------------------------------------------------------------------+
|  Page Title: Auditlog Overview                                           [View in Mobile App >] |
|  Subtitle: This page shows recent administrator activity                                      |
+-----------------------------------------------------------------------------------------------+
|  [ Stat Card 1 ]    [ Stat Card 2 ]    [ Stat Card 3 ]    |          [ Large Highlight Stat ] |
|  Authorized: 1,395  Protected: 1,258   Alerts: 62 (-22%)  |          1,395 (April 2026)       |
+-----------------------------------------------------------------------------------------------+
|  [ Interactive Spline Activity Chart & Histogram with Date Filters: 1D | 1W | 1M | 1Y | MAX ]   |
+-----------------------------------------------------------------------------------------------+
|  [ Search input ]  [ Filters V ]  [ Export CSV v ]  [ Page size: 15 v ]                        |
|  Table: Status | Action/Entity | User/Admin | Target ID | Time | Duration | Payload Diff      |
+-----------------------------------------------------------------------------------------------+
```

### 3.1 Top Header Bar
- **Brand Logo**: E² Stories gold/crimson insignia.
- **Navigation Pills**: Centered active pill navigation (`Summary`, `Auditlog`, `Dramas`, `Episodes`, `Users`, `Subscriptions`).
- **Right Utilities**:
  - Privilege / Role badge (`Super Admin`, `Content Manager`).
  - Admin Avatar & Name dropdown with Profile settings & Log Out.
  - Quick App Switcher / External link icon (`You can also view these data using the mobile app`).

---

## 4. Key Screen Specifications

### 4.1 Dashboard Overview (`/admin/summary`)
- **Top Metrics Row**:
  - Total Registered Users (+% monthly delta pill).
  - Active Paid Members (Revenue-generating subscribers).
  - Total Video Views & Completion Rate.
  - Monthly Recurring Revenue (MRR in ₹ INR).
- **Trend Charts**:
  - Smooth violet spline curve displaying daily watch sessions.
  - Bar chart showing user acquisition (Organic vs Referral).
- **Quick Action Bar**:
  - `+ Ingest New Drama`
  - `+ Add Episode`
  - `Broadcast Push Notification`

### 4.2 Drama Management Studio (`/admin/dramas`)
- **Data Table View**:
  - Columns: Poster Thumbnail (9:16), Drama Title, Genres, Total Episodes, Views, Status (`Published`, `Draft`, `Archived`), Actions.
  - Bulk actions: Change status, Reorder trending rank, Delete.
- **Drama Ingestion Drawer / Modal**:
  - Title, Slug (auto-generated), Multi-language Synopsis.
  - Genre Selector (Romance, Thriller, Drama, Action, etc.).
  - File Dropzones:
    - 9:16 Portrait Poster (min 1080x1920).
    - 16:9 Carousel Banner (min 1920x1080).
    - 9:16 Trailer Video preview (MP4).
  - Curation Toggles: `Is Featured (Hero Carousel)`, `Is Trending (Assign Rank 1-10)`, `Is New Release`.

### 4.3 Episode Studio (`/admin/episodes`)
- **Filter by Drama**: Dropdown selector to isolate a specific drama's episodes.
- **Episode List**:
  - Reorderable list (drag-to-sort episode number).
  - Columns: Ep #, Title, Duration, Paywall Status (`Free` vs `Premium Locked`), Subtitles (`Hindi`, `English`), Video Status.
- **Episode Uploader**:
  - Video file uploader with chunked upload progress bar.
  - Subtitle manager: Add multi-lingual tracks (`.vtt` or `.srt`).
  - `Is Free Preview` switch (determines if episode unlocks without subscription).

### 4.4 User & Subscriber Manager (`/admin/users`)
- **Search & Filter**: Search by phone number (+91...), email, or user name.
- **Filter Pills**: `All Users`, `Subscribed`, `Free Users`, `Suspended`.
- **User Detail Modal**:
  - Joined date, Last active timestamp, Device info.
  - Preferred content languages & selected genre interests.
  - Active subscription details (Plan code, Starts at, Expires at, Razorpay Payment ID).
  - Action: `Override Subscription Status` (Grant 30 days access or Revoke).

### 4.5 Subscription & Revenue Tracker (`/admin/subscriptions`)
- **Plan Configuration**: Manage Monthly (₹199) and Yearly (₹1,499) plan pricing, status, and perk bullet points.
- **Transaction Ledger**:
  - Table: Razorpay Payment ID, Order ID, User Phone, Plan, Amount, Status (`SUCCESS`, `FAILED`), Timestamp.
  - Export to CSV for tax and accounting.

### 4.6 Auditlog Overview (`/admin/auditlog`)
- Direct visual clone of the Nodus reference:
  - Header statistics: `Authorized Actions`, `Protected Resources`, `Alerts`.
  - Date Range Scroller: `1D`, `1W`, `1M`, `1Y`, `MAX`.
  - Activity Histogram: Hourly/daily action density.
  - Filterable Table:
    - Status pill (`Finished` with green check, `Failed` with red alert).
    - Action type (`CREATE_DRAMA`, `UPDATE_EPISODE`, `OVERRIDE_SUBSCRIPTION`).
    - Admin User (`Greg B / Admin`).
    - Target Entity & ID.
    - Timestamp & Duration.
    - Expandable JSON Diff modal showing exact before/after field changes.

---

## 5. UI Components & Micro-Interactions

1. **Buttons**:
   - Primary: Solid pastel `#FEF08A` (hover `#FDE047`) with flat clean aesthetic and subtle 150ms transition.
   - Danger: Muted red `#EF4444` for delete and account suspension.
   - Secondary: Dark outline `#232638` with hover surface highlight.
2. **Status Badges**:
   - Small rounded pills with solid status dot (Green for active/published, Yellow for draft, Red for expired).
3. **Empty States & Skeletons**:
   - Shimmer animation loading skeletons for tables and stat cards to prevent layout shifts.
   - Distinct illustrated empty states for search queries with 0 results.
