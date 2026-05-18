# Initial project notes

"Diveyness" is a colloquial term used to describe the unpretentious, worn-in, and authentic charm of a "dive bar" or similar establishment.

## Project decription
A database for dive bars.
Codename DBDB.
The DBDB contains bars that are rated on the diveyness scale all across the globe. These bars can be viewed and filtered on a map, just like Google Maps.


## Features:
* **Import bar from Google Maps:** Search for a bar using Google Places autocomplete, click to select, and instantly import its Name, Address, and Coordinates (Latitude/Longitude) into the local database.
* **Manual Bar Entry:** Users can add bars manually by dragging a pin or typing details if the bar isn't listed on Google Maps.
* **Maps Integration:** View and filter all imported and manual dive bars on an interactive map (Mobile-first, desktop friendly).
* **Hybrid Rating System:**
    * **Mandatory Simple Rating:** A 1-to-5 star scale for the overall "Diveyness" score.
    * **Optional Extensive Rating:** Users can expand a section to provide:
        * Rating system for absolute prices (price per ml)
        * Rating system for relative prices (compared to normal prices in region)
        * Rating system for murkiness (Murky, Average, Actually nice)
        * Custom text reviews and photo uploads (stored via a simplified local/public uploads folder)
* **Unauthenticated User & Cookie Model:**
    * 100% anonymous: No sign-ups, logins, or authentication screens.
    * Double-rating prevention: Reviews are saved on the server for global aggregation, and a secure client session cookie keeps track of the bar IDs this browser has reviewed to prevent double-ratings.
    * Review Editing: Users can edit or update their previous reviews by validating against the unique review ID/signature stored in their browser cookies.

## Tech stack:
* **Framework:** Next.js (Monolithic SSR and Route Handlers)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Map:** Leaflet / OpenStreetMap or Google Maps API (Simple embedded or cached searches)
* **Database:** SQLite (Stored as a single file in the workspace, queried via Prisma or Drizzle ORM)

## Other requirements:
* Create new Git Repository
* Create extensive plan for building this application
* Create `.env` file and `.env.example`
* Create `.gitignore` file (specifically ignoring the SQLite database file and uploads folder)

## Deployment & Hosting
* Will be hosted on a self-hosted VPS.
* Deployed using **CapRover** as a single Next.js container.
* Database persistent volume mounted to persist the SQLite file and uploaded photos across deployments.