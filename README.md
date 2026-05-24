# Dev Kanban (teaching app)

No-backend Kanban board for developers. Pure HTML/CSS/JS, plus a tiny Python static server.

## Features
- Client-side login
- Pages: login, board, settings, about, privacy
- Columns: Backlog, In Progress, Review, Done
- Create/delete tasks, move between columns
- Drag & Drop (HTML5)
- Filters: assignee, priority
- Light/Dark theme (with intentional bug: switching doesn't apply until reload)
- Extra backlog seed tasks
- Local persistence with migration from legacy key

## Run locally
```bash
python3 serve.py
# Then open http://localhost:8000/index.html
```

## Google Maps setup (Autocomplete + Geocoding + Street View)
1. Create a Google Cloud project.
2. Enable billing for the project.
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Street View Static API
4. Create API keys:
   - **Frontend/browser key** (for address autocomplete and preview): set `VITE_GOOGLE_MAPS_API_KEY`.
   - **Server key** (for Netlify function geocoding): set `GOOGLE_MAPS_API_KEY`.
5. Restrict the frontend key:
   - Application restriction: **HTTP referrers** (your domains only).
   - API restriction: Maps JavaScript API, Places API, Geocoding API, Street View Static API.
6. Restrict the server key:
   - API restriction: Geocoding API (and only server-side APIs you need).
   - Never expose this key in browser code.

These restrictions follow Google Maps Platform security best practices to reduce unauthorized usage and billing abuse.
