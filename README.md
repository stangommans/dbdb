# DBDB 🍺 — Divebar Database

> **DBDB** is a lightweight, mobile-first web application designed for rating, bookmarking, and discovering authentic local dive bar retreats. Designed with a custom **"Moody Underground"** aesthetic—featuring velvet deep charcoal canvas layers, glowing neon amber accents, and glassmorphic panels.

---

## 🎨 Design Theme: Moody Underground
DBDB's visual identity relies on strict typography hierarchy and color contrast rules implemented dynamically via custom Tailwind CSS variables:
*   **Velvet Canvas Background:** `#131313` — captures the dim, intimate lounge atmosphere.
*   **Charcoal Surface Hierarchy:** Surface layers partition sections cleanly:
    *   `Lowest Container:` `#0e0e0e` (Deepest shadows)
    *   `Low Surface Container:` `#1c1b1b` (Panels and lists)
    *   `Base Container:` `#201f1f` (Gratings and controls)
    *   `High Elevated Container:` `#2a2a2a` (Modals and buttons)
*   **Glowing Neon Amber:** Primary accents and pulsing circular map pins (`#f59e0b` / HSL custom glow filters).
*   **Aesthetic Typography:** Built with **Outfit** (sharp, display headers) and **Inter** (highly readable medium-contrast body labels, maintaining a minimum `11px` accessibility floor).

---

## 🚀 Key Features

### 🗺️ 1. Interactive Map View
*   Features a responsive full-canvas dark-themed Leaflet map.
*   Pins represent ratings using custom neon-glowing circular anchors.
*   Clicking any coordinate on the map dynamically launches the manual capture drawer, allowing you to add coordinates instantly.

### 🧭 2. Explore Bento Grids
*   A responsive Explore page displaying dive spots in dynamic grids.
*   Showcases human-friendly relative pricing (e.g. `$$$`), distance approximations, and rating capsules.
*   Supports sorting dynamically by score, review frequency, or name.

### 📁 3. Glass Filters Overlay
*   A sliding glass-blur control panel enabling real-time filtering:
    *   Search terms matching names or addresses.
    *   Budget/Premium limit star filters.
    *   Multi-toggle vibe chips: `CRAFT BEER`, `POOL TABLE`, `LIVE MUSIC`, `CASH ONLY`, `SMOKING AREA`, `JUKEBOX`, and `DARTBOARD`.

### 🔒 4. My Stash (Private Bookmarks)
*   Keeps client privacy 100% secure.
*   A dedicated "Stash" tab allows you to bookmark retreat spots.
*   Bookmarks are stored entirely in client-side **`localStorage`**, so they never touch a database or compromise your personal preferences.

### 👤 5. Anonymous Profiles
*   Backed by cryptographic signatures served via HTTP-Only session cookies.
*   Requires no emails, credentials, or logins.
*   Tracks contributions (total reviews written, image uploads, and stashed retreats) in real time.

### 🛡️ 6. Passcode-Gated Admin Overrides
*   **Verify API:** An environment-driven endpoint that validates passwords securely without exposing secret keys to JS client bundles.
*   **Profile tab activation:** Entering your secret passcode unlocks global deletion overrides, blinking an orange indicator dot in the header.
*   **Delete spots & reviews:** Red moderation trash keys are injected directly into detailed drawer timelines.
*   **SQLite Cascade Deletes:** Bar purges cascade automatically in Prisma, wiping associated ratings atomically.

---

## 🛠️ Technology Stack
*   **Core Framework:** [Next.js 15+](https://nextjs.org/) (App Router, dynamic Turbopack assembly).
*   **Database ORM:** [Prisma](https://www.prisma.io/) client.
*   **Database Container:** [SQLite](https://www.sqlite.org/) local dev database.
*   **Styling Engine:** Tailwind CSS with custom global CSS utilities.
*   **Mapping Library:** [Leaflet](https://leafletjs.org/) API with CartoDB custom tiles.

---

## 📦 Quick Start & Setup

### 1. Configure Environmental Variables
Copy the template configuration into your local environment:
```bash
cp .env.example .env
```
Inside your new `.env` file, populate:
*   `DATABASE_URL`: Path to your SQLite DB file (e.g. `"file:./dev.db"`).
*   `COOKIE_SESSION_SECRET`: A 32-character encryption key for sessions.
*   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Your active Google Places/Maps API key.
*   `ADMIN_PASSCODE`: Your custom administrative password override (defaults to `"dbdb-admin"` if omitted).

### 2. Initialize Database & Seed
Install the dependencies, sync your database schema, and seed the database with mock spots:
```bash
# Install packages
npm install

# Run Prisma schema migration
npx prisma migrate dev --name init

# Seed mock bars database
npm run seed
```

### 3. Launch Local Dev Server
Fire up the local compiler:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser and dive in!

---

## 📝 Moderating Content
To moderate spots and reviews:
1. Open the **Profile** tab in the app.
2. Under **System Administration**, enter your configured `ADMIN_PASSCODE` (default is `dbdb-admin` or `dbdb2026`).
3. Click **Unlock System** — a pulsing status indicator dot will activate in the top header.
4. Click on any bar pin or bento card to open its Detailed Drawer. Click the red trash button next to the heart (for spots) or the timeline delete buttons (for reviews) to purge data.

---

## 🔮 Future Roadmap
*   [ ] **Major Upgrade to Prisma v7**: Complete the transition to the latest Prisma engine (`v7.8.0`+). This architectural upgrade will involve:
    *   Migrating the database connection string locator out of the `prisma/schema.prisma` file and centralizing it inside a programmatic `prisma.config.ts`.
    *   Integrating official Prisma driver adapters (e.g. `@prisma/adapter-better-sqlite3` combined with standard `better-sqlite3` native drivers) to support direct SQLite connections in runtime standalone Next.js environments, ensuring compatibility with the new v7 constructor requirements.

