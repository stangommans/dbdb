# Changelog

All notable changes to the Divebar Database (DBDB) project will be documented in this file.

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
