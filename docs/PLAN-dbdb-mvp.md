# PLAN: DBDB (Divebar Database) Lightweight MVP

A comprehensive, step-by-step roadmap for building **DBDB (Divebar Database)** as a lightweight, unauthenticated, single-container web application using **Next.js, Tailwind CSS, TypeScript, SQLite, and Leaflet/Google Maps**, ready for deployment on a self-hosted VPS via **CapRover**.

---

## 🎯 Success Criteria
- **Instant Google Maps Import:** Users can search for a bar using a Google Places autocomplete search bar, click it, and instantly import its details into the database.
- **Zero Login Overhead:** 100% anonymous users can add/import dive bars, view them on an interactive map, and leave ratings.
- **Double-Rating Prevention:** Browser cookies prevent a user from rating a bar more than once.
- **Anonymous Review Editing:** Users can edit their previously submitted reviews by validating against unique cryptographic IDs stored in their local cookies.
- **Zero-ops Database:** Uses a local SQLite file stored in a persistent volume, removing the need for a separate database container.
- **Deploy Ready:** Includes Docker & CapRover configurations to run as a single container.

---

## 🏗️ Technical Stack & Rationale
- **Framework:** Next.js (App Router, monolithic API routes and Route Handlers).
- **Styling:** Tailwind CSS (for fast, responsive, and stunning mobile-first UI).
- **Database:** SQLite (lightweight, zero-config, ultra-portable, easy backup).
- **ORM:** Prisma or Drizzle ORM (simplifies SQLite schema migrations and provides full TypeScript safety).
- **Maps & Import Integration:** **Leaflet & OpenStreetMap** for high-performance, cost-free interactive map rendering, combined with the **Google Places API** (Client-side Autocomplete SDK loaded with an API key) specifically to power the high-speed search and import capabilities.
- **Tracking:** Cryptographic anonymous session ID stored in a secure client cookie (`dbdb_session_token`).

---

## 📁 Proposed Folder Structure
```text
divebar-database/
├── docs/
│   ├── design/                      # Wireframes, mockups, & assets
│   ├── design-system.md             # UI/UX guidelines & colors
│   ├── PLAN-dbdb-mvp.md             # This plan
│   └── initial-project-idea.md      # Core specifications
├── prisma/                          # Prisma ORM setup (if using Prisma)
│   ├── schema.prisma                # SQLite schema definition
│   └── dev.db                       # Local SQLite database (git-ignored)
├── public/
│   ├── uploads/                     # Uploaded bar photos (git-ignored)
│   └── placeholder.webp             # Beautiful fallback bar image
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout & Google Fonts (Inter/Outfit)
│   │   ├── page.tsx                 # Main interactive map & search dashboard
│   │   ├── api/
│   │   │   ├── bars/
│   │   │   │   └── route.ts         # GET (fetch all bars), POST (create bar)
│   │   │   └── reviews/
│   │   │       ├── route.ts         # POST (submit review, set cookie)
│   │   │       └── [id]/
│   │   │           └── route.ts     # PUT (edit review, verify cookie)
│   │   └── global.css               # Vanilla CSS + Tailwind utilities
│   ├── components/
│   │   ├── MapViewer.tsx            # Leaflet / Maps wrapper component
│   │   ├── AddBarPanel.tsx          # Slide-over panel to manually add a bar
│   │   ├── BarDetailPanel.tsx       # Details, average ratings, and reviews list
│   │   └── ReviewForm.tsx           # Rating sliders, inputs, and photo upload
│   ├── lib/
│   │   ├── db.ts                    # DB connection initializer
│   │   ├── cookies.ts               # Anonymous cookie helper functions
│   │   └── types.ts                 # Shared TypeScript interfaces
├── .env.example                     # Environment variables template
├── .gitignore                       # Standard rules + ignores dev.db & uploads/
├── Dockerfile                       # Monolithic container build file
└── captain-definition               # CapRover deploy blueprint
```

---

## 💾 Database Schema (SQLite)

We will use a relational structure mapping bars to their reviews.

```prisma
// prisma/schema.prisma

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Bar {
  id            String   @id @default(uuid())
  name          String
  address       String
  latitude      Float
  longitude     Float
  googlePlaceId String?  @unique // Optional to prevent importing duplicate bars from Google Maps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  reviews       Review[]
}

model Review {
  id            String   @id @default(uuid())
  barId         String
  bar           Bar      @relation(fields: [barId], references: [id], onDelete: Cascade)
  
  // Mandatory Rating
  diveScore     Int      // 1 to 5 scale
  
  // Optional Detailed Ratings
  pricePerMl    Float?   // Absolute price rating
  relativePrice Float?   // 1 to 5 regional price rating
  murkiness     String?  // "MURKY" | "AVERAGE" | "ACTUALLY_NICE"
  comment       String?  // Optional text review
  photoUrl      String?  // Path to local public upload
  
  // Cryptographic signature matching user's cookie to prevent double votes and allow editing
  reviewerToken String   
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## 🛠️ Step-by-Step Task Breakdown

### Phase 1: Foundation & Setup (P0)

#### Task 1.1: Git & Workspace Initialization
- **Agent:** `project-planner`
- **Skill:** `clean-code`
- **Dependencies:** None
- **Description:** Initialize git repository, configure `.gitignore` to protect local files, and create `.env.example`.
- **INPUT:** Clean workspace.
- **OUTPUT:** `.gitignore` ignoring SQLite files (`*.db`, `*.db-journal`), node modules, and `public/uploads/`. Working `.env.example`.
- **VERIFY:** Run `git status` to verify ignores are configured correctly.

#### Task 1.2: Next.js Project Scaffolding
- **Agent:** `frontend-specialist`
- **Skill:** `app-builder`
- **Dependencies:** Task 1.1
- **Description:** Create the Next.js TypeScript application inside the current directory using `npx -y create-next-app@latest ./ --ts --tailwind --app --src-dir --import-alias "@/*" --use-npm --eslint`.
- **INPUT:** Workspace with config files.
- **OUTPUT:** Next.js project scaffold.
- **VERIFY:** Run `npm run dev` and ensure the base dev server starts.

#### Task 1.3: Prisma ORM & Database Setup
- **Agent:** `database-architect`
- **Skill:** `database-design`
- **Dependencies:** Task 1.2
- **Description:** Install Prisma CLI (`npm install prisma --save-dev` & `@prisma/client`), initialize schema, specify SQLite provider, and create the initial migration.
- **INPUT:** Next.js project.
- **OUTPUT:** `prisma/schema.prisma` containing the `Bar` and `Review` schemas, and a local `prisma/dev.db` SQLite file.
- **VERIFY:** Execute `npx prisma db push` to synchronize schemas and verify `dev.db` is created.

---

### Phase 2: Cookies & API Logic (P1)

#### Task 2.1: Anonymous Cryptographic Cookie Helper
- **Agent:** `backend-specialist`
- **Skill:** `api-patterns`
- **Dependencies:** Task 1.3
- **Description:** Write server-side and client-side cookie helper utilities. On the first rating or review, generate a secure, random cryptographic `reviewerToken` (UUID) stored in a secure client cookie (`dbdb_reviewer_token`) that persists for 365 days. 
- **INPUT:** Workspace structure.
- **OUTPUT:** `src/lib/cookies.ts` with token generation, verification, and cookie validation helpers.
- **VERIFY:** Run unit tests or inspect API requests to see the custom cookie being created and transmitted.

#### Task 2.2: Bar and Review REST API Routes
- **Agent:** `backend-specialist`
- **Skill:** `api-patterns`
- **Dependencies:** Task 2.1
- **Description:** Implement App Router endpoints:
  - `GET /api/bars`: Fetch all bars along with aggregated review metrics (Average Diveyness Score).
  - `POST /api/bars`: Add a new bar to the database (Name, Address, Lat, Lng).
  - `POST /api/reviews`: Submit a review. Validate `reviewerToken` cookie. If the user already has a review for this `barId` matching their token, reject the submission to prevent double-voting.
  - `PUT /api/reviews/[id]`: Edit a review. Check that the request's current `reviewerToken` cookie matches the database `reviewerToken` for the review being modified.
- **INPUT:** SQLite database schema.
- **OUTPUT:** REST API routing files under `src/app/api/`.
- **VERIFY:** Perform manual POST/GET tests using `curl` or Postman to ensure review submissions are created, double-voting blocks, and review modifications are approved/denied correctly.

---

### Phase 3: Premium Map & UI Implementation (P2)

#### Task 3.1: Leaflet / OpenStreetMap Shell Setup
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **Dependencies:** Task 2.2
- **Description:** Install Leaflet mapping library dependencies (`leaflet`, `react-leaflet`, `@types/leaflet`). Create a reusable `<MapViewer />` client component that loads asynchronously (to avoid SSR build issues) and renders pins for all database bars.
- **INPUT:** Leaflet packages.
- **OUTPUT:** `src/components/MapViewer.tsx` component displaying bars on the map layout.
- **VERIFY:** Open page in local browser and verify Leaflet loads, displays pins, and allows double-clicking or dragging to find coords.

#### Task 3.2: Google Maps Import & Manual Add Bar Slide-Over
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **Dependencies:** Task 3.1
- **Description:** Design premium mobile-first slide-over overlays (glassmorphism cards) for adding/viewing bars:
  - **Add Bar Overlay:** Features a **Google Places Autocomplete input field**. When a user types a bar name and selects it from the autocomplete list, the client-side Google SDK extracts the bar's name, formatted address, latitude, and longitude, and sends them to `POST /api/bars` to instantly import it. It also supports manual coordinates capture by double-clicking on the map.
  - **Bar Details Overlay:** Displays average dive score, absolute and relative price indices, and murkiness status. Includes a beautiful list of anonymous reviews.
- **INPUT:** Google Places API loader script integration, slide-over overlay UI components.
- **OUTPUT:** Interactive slide-over modal panels supporting both Google Maps Autocomplete Import and manual entry.
- **VERIFY:** Search for a real bar in the search field, verify it autocompletes, click to import, and ensure the new bar pin immediately populates on the map.

#### Task 3.3: Hybrid Rating Form (Mandatory & Optional Sliders)
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **Dependencies:** Task 3.2
- **Description:** Build the review submission form. 
  - Mandatory fields: overall 1-to-5 star rating.
  - "Expand Extensive Ratings" button opens sub-fields: absolute price-per-ml inputs, relative price comparison slider (Cheap to Premium), and murkiness drop-down (Murky, Average, Actually Nice).
  - Handles photo file uploads directly to the `/public/uploads/` directory on the server.
- **INPUT:** Detail components.
- **OUTPUT:** Custom review input form with sliding animations.
- **VERIFY:** Submit a review and verify that database inputs align perfectly with optionally filled parameters.

---

### Phase 4: CapRover & VPS Packaging (P3)

#### Task 4.1: CapRover Container Configuration
- **Agent:** `devops-engineer`
- **Skill:** `server-management`
- **Dependencies:** Task 3.3
- **Description:** Author a single-stage `Dockerfile` running node, building the Next.js static asset build, executing migrations upon container boot (`npx prisma db push`), and initiating the production server. Write the `captain-definition` file for CapRover.
- **INPUT:** Monolithic workspace.
- **OUTPUT:** `Dockerfile` and `captain-definition` files at project root.
- **VERIFY:** Verify the Docker build processes locally without warning or error structures.

---

## 🏁 Phase X: Verification Checklist
Before declaring the MVP ready for VPS deploy:
- [ ] **Lint and Type Check:** Run `npm run lint` and `npx tsc --noEmit` and pass.
- [ ] **No Double Rating:** Manually verify that a single browser cannot submit two reviews for the same bar.
- [ ] **Anoymous Editing:** Submit a review, verify it locks, click "Edit Review", submit a change, and confirm the DB updates.
- [ ] **Aesthetics Check:** Ensure responsive glassmorphism styles, dark mode consistency, and smooth micro-animations. No generic button styling.
- [ ] **CapRover Volume Bindings Plan:** Verify that CapRover persistent storage is mapped to `/app/prisma/dev.db` and `/app/public/uploads` so that databases and uploads are preserved across container updates.

---

## 🔮 Future Roadmap
- [ ] **Major Upgrade to Prisma v7**: Complete the transition to the latest Prisma engine (`v7.8.0`+). This architectural upgrade will involve:
  - Migrating the database connection string locator out of the `prisma/schema.prisma` file and centralizing it inside a programmatic `prisma.config.ts`.
  - Integrating official Prisma driver adapters (e.g. `@prisma/adapter-better-sqlite3` combined with standard `better-sqlite3` native drivers) to support direct SQLite connections in runtime standalone Next.js environments, ensuring compatibility with the new v7 constructor requirements.
