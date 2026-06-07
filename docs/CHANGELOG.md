# Changelog

All notable changes to the Divebar Database (DBDB) project will be documented in this file.

## [1.7.0] - 2026-06-07

### Added
- **Consolidated Nearby Discovery**:
  - Integrated proximity/nearby sorting selection toggles directly into the core `ExploreView` header.
  - Implemented an intuitive, beautiful contextual permission warning banner that prompts the user to share location only when "Nearby" sorting is selected without active GPS coordinates.
  - Streamlined state mapping in `DashboardShell.tsx` to handle explore sorting preferences and GPS coordination.

### Removed
- **Decommissioned Route Cleanup**:
  - Removed all automatic redirects from explore to nearby on mount.
  - Deleted the deprecated separate `/nearby` route folder and pages.
  - Trimmed the bottom navigation bar to exclude the now-redundant Nearby tab link and icons.

## [1.6.0] - 2026-06-07

### Added
- **Interactive Feedback Kanban**:
  - Implemented a 4-column (Pending, Under Review, Planned, Completed) Kanban board for managing user feedback and feature requests.
  - Added native Drag-and-Drop column transitions with animated drop zone borders.
  - Created a responsive `viewMode` toggle defaulting to Kanban on desktop ($\ge$ 1024px) and List on mobile.
  - Designed interactive cards with inline editing textareas, touch-friendly fallback status dropdowns, and confirmable deletion triggers.
  - Ported the Kanban dashboard to the public `/about` page, dynamically unlocking full administrative features upon entering a valid passcode.
- **Dynamic SEO Sitemap (`sitemap.ts`)**:
  - Generates an automated dynamic XML sitemap mapping static indices (`/`, `/explore`, `/about`) alongside all dynamic `/bar/[id]` details populated directly from database records.
- **Crawler Access Control (`robots.ts`)**:
  - Implemented crawler policies explicitly blocking crawl budgets on `/admin`, user `/profile`, `/stash`, and backend `/api/*` endpoints while permitting exploration paths.
- **JSON-LD Schema Rich Snippets**:
  - Automatically embeds Schema.org `Bar` and `AggregateRating` JSON-LD scripts server-side on `/bar/[id]` endpoints.
- **Canonical Alternate Tags**:
  - Configured project-wide canonical URLs and `metadataBase` on dynamic and static paths.

### Fixed
- **Runtime TypeError**: Added optional typing and fallback render checks to prevent client-side crashes on community feedback entries lacking a `reviewerToken`.

## [1.5.0] - 2026-06-06

### Added
- **Global Branding Purge**: Removed all occurrences of "anonymous" and "anonymously" across user-facing layouts, document metadata, rating/review submission forms, profile pages, and codebase comments.
- **About Page Redesign**:
  - Restructured the page with a full-width header block containing two columns: `"Why DBDB?"` (left) and `"What is a Dive Bar?"` (right).
  - Wrote a new origin narrative featuring Barcelona travel stories, digital agency interns, Reddit research references, and customized vocabulary for "neighborhood watering holes" and "cozy brown cafés".
  - Embedded developer, version, and source code metadata directly into a 3-column row inside the right section, removing the standalone `"About DBDB"` sidebar card.
  - Aligned all subheadings under the About section (Why DBDB?, What is a Dive Bar?, About DBDB) with uniform typography and amber-accented material icons.
  - Promoted the `"Global Platform Metrics"` section to a full-width block below the top panel to balance the layout.
- **Admin Verification Fix**: Aligned the `/api/admin/verify` endpoint payload with the admin verification middleware to fix passcode login failures on direct navigations to `/admin`.
- **UI Cleanups**: Removed the redundant system passcode gate and administrative text mentions from the public `/about` page.

## [1.4.0] - 2026-06-04

### Changed
- **Fullscreen Mobile Overlays**: Configured all overlays, sliding sheets, drawers, and modal views to render as true borderless fullscreen panels (`h-dvh`) on mobile screens to eliminate dead space and virtual keyboard occlusion. This includes the Add Bar sheet, Filter overlay, Discover Dives list drawer, Bar Details drawer, Review Form sheet, and Review Detail modal.
- **Profile Feed Alignment**: Refactored the ProfileView page layout to remove external borders and background frames, while keeping internal texts and controls beautifully aligned via proper mobile horizontal padding.
- **Explore Card Spacing**: Restored the bento grid margins and glass card boundaries in ExploreView on mobile to give cards adequate air on the left and right sides.

## [1.3.0] - 2026-06-04

### Added
- **Interactive User Review Feed**: Displayed the authenticated user's reviews list with responsive pagination (10 reviews per page) on the profile page, including "Go to Bar", "Edit", and self-deletion actions.
- **Dedicated About Page**: Extracted overall stats, system administration controls, and the "About DBDB" markdown overview into a brand new `/about` page.
- **Admin Database Control Portal (`/admin`)**:
  - Implemented secure administrative passcode gates (`/api/admin/verify` and passcode login UI).
  - Designed a full-width spots database table with quick bar deletion options.
  - Interactive details view to review history, with custom checkbox bulk deletion (`DELETE /api/reviews`).
  - Interactive table sorting headers to sort bars by Reviews count, Dive Score, and Name.
  - Dynamic location/country filtering dropdown parsing bar address strings, showing dynamic count annotations per country (e.g. `Netherlands (8)`).
- **Permalink Routing**: Created native permalinks for `/explore`, `/stash`, `/profile`, `/about`, and `/admin`.

### Changed
- **Navigation Controls**: Refactored the floating navigation pill into a premium, icon-only navigation structure mapping to clean permalinks.

## [1.2.0] - 2026-06-01

### Removed
- **Deprecated Metrics**: Completely removed `relativePrice` and `murkiness` metrics from Prisma database schema, API route handlers (`/api/bars`, `/api/reviews`, `/api/reviews/[id]`), and database logic.
- **Atmospheric Murkiness and Price widgets**: Purged the corresponding visual components, sliders, and accordion toggles from the Review Form, Details Drawer, Stash View, Explore View, Profile View, and Filter Overlay.

### Changed
- **Filter Layout Labels**: Fixed a layout label typo inside the Filter settings overlay where the Rating filter incorrectly read "Any Murkiness" instead of "Any Score".
- **Metadata Streamlining**: Updated SEO meta descriptions in layout templates to reflect the new simplified metric structure.

## [1.1.0] - 2026-06-01

### Added
- **Floating Bottom Navigation Bar**: Introduced a unified, glassmorphism-styled floating pill at the bottom of the screen (`fixed bottom-6 left-1/2`) to replace cluttered header and mobile bar layouts.
- **Currency Pill Interface**: Integrated a touch-friendly currency selection grid (EUR, USD, GBP) inside the filter settings overlay, persisting the active currency choice in `localStorage`.
- **Admin Active Status Overlay**: Repositioned the admin console active ping dot to float directly on the beer mug brand icon, ensuring visibility across all screen sizes.

### Changed
- **Centered Header Stats**: Aligned the global statistics panel absolutely in the center of the desktop header to optimize structural layout and screen aesthetics.
- **Mobile Brand Decluttering**: Hid the large `"DBDB"` text on viewports under 640px to prevent horizontal layout crowding, keeping `"DIVEBAR DATABASE"`.
- **List View Trigger Offset**: Shifted the mobile "List View" floating trigger button from `bottom-28` to `bottom-36` to clear system safe areas and the new bottom floating navigation bar.
- **Responsive Navigation Hiding**: Added smooth slide/fade animations to hide the bottom navigation pill whenever a mobile details drawer or list drawer is active.
