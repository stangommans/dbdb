# Changelog

All notable changes to the Divebar Database (DBDB) project will be documented in this file.

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
