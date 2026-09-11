# Team ResQ: Free Resources Guide

A practical resource reference for building the Emergency Resource Allocation system, focusing on free, open, and reliable tools.

## Maps & Geospatial

| Resource | License | Free Limit | Use For | URL |
| :--- | :--- | :--- | :--- | :--- |
| **Leaflet.js** | MIT, free | Unlimited | Main map library | [leafletjs.com](https://leafletjs.com/) |
| **OpenStreetMap tiles** | ODbL, free | Unlimited | Map baselayer (`tile.openstreetmap.org`) | [openstreetmap.org](https://www.openstreetmap.org/) |
| **OpenRouteService API** | Custom | 2,000 req/day | Routing with road constraints, ETA calculation | [openrouteservice.org](https://openrouteservice.org/) |
| **OSRM** | Apache 2.0 | Unlimited (Self-hosted) | Fast routing | [project-osrm.org](https://project-osrm.org/) |
| **Turf.js** | MIT, free | Unlimited | Geospatial ops: clustering, distance, bbox, centroid | [turfjs.org](https://turfjs.org/) |
| **leaflet.heat** | MIT, free | Unlimited | Heatmap overlay | [github.com/Leaflet/Leaflet.heat](https://github.com/Leaflet/Leaflet.heat) |
| **leaflet.markercluster**| MIT, free | Unlimited | Marker clustering | [github.com/Leaflet/Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) |
| **Overpass Turbo** | Open | Unlimited | Extract OSM roads/hospitals/shelters for Uttarakhand | [overpass-turbo.eu](https://overpass-turbo.eu/) |
| **OSM Nominatim** | ODbL, free | 1 req/sec | Geocoding Uttarakhand valley sectors | [nominatim.org](https://nominatim.org/) |

## AI / NLP

| Resource | License | Free Limit | Use For | URL |
| :--- | :--- | :--- | :--- | :--- |
| **Google Gemini Flash API (Free Tier)** | Commercial | $5 credits + Student | Text/image extraction, narrative | [Google Gemini.com](https://www.Google Gemini.com/) |
| **Gemini API** | Commercial | 15 req/min tier | Alternative LLM for extraction | [aistudio.google.com](https://aistudio.google.com/) |
| **Web Speech API** | Web Standard| Unlimited | Voice→text for report submission | [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) |
| **@xenova/transformers** | MIT, free | Unlimited (Local) | Run Whisper in browser, no API key | [huggingface.co/docs/transformers.js](https://huggingface.co/docs/transformers.js/) |
| **HF Inference API** | Custom | Free Tier | Sentence transformers for semantic similarity | [huggingface.co](https://huggingface.co/) |

## Backend / DB

| Resource | License | Free Limit | Use For | URL |
| :--- | :--- | :--- | :--- | :--- |
| **Supabase** | Open Core | 500MB DB, 2GB Bandwidth| Postgres/PostGIS, Realtime, Auth | [supabase.com](https://supabase.com/) |
| **Railway** | Commercial | $5/month credits | Express/Node backend hosting | [railway.app](https://railway.app/) |
| **Vercel** | Commercial | Free tier (Hobby) | React/Frontend hosting | [vercel.com](https://vercel.com/) |
| **Redis Cloud** | Commercial | Free 30MB | Pub/sub caching for realtime updates | [redis.com](https://redis.com/) |

## Optimisation

| Resource | License | Free Limit | Use For | URL |
| :--- | :--- | :--- | :--- | :--- |
| **Google OR-Tools** | Apache 2.0 | Unlimited | Advanced solver (if using Python backend) | [developers.google.com/optimization](https://developers.google.com/optimization) |
| **javascript-lp-solver** | MIT, free | Unlimited | Linear programming in Node.js | [github.com/JWally/jsLPSolver](https://github.com/JWally/jsLPSolver) |
| **Custom Greedy Algo** | N/A | N/A | Recommended for hackathon, easier to demo | N/A |

## India Disaster Data (FREE, open)

| Resource | License | Free Limit | Use For | URL |
| :--- | :--- | :--- | :--- | :--- |
| **NDRF Equipment List** | Gov Open | Unlimited | Real resource types for seeding DB | [ndrf.gov.in/en/equipment](https://ndrf.gov.in/en/equipment) |
| **NDMA Guidelines** | Gov Open | Unlimited | Real NDRF/SDRF structure references | [ndma.gov.in](https://ndma.gov.in/) |
| **IDRN** | Gov Open | Unlimited | Real agency resource categories | [idrn.gov.in](https://idrn.gov.in/) |
| **OSM Overpass Turbo** | ODbL, free | Unlimited | Live data on Uttarakhand roads, hospitals, shelters | [overpass-turbo.eu](https://overpass-turbo.eu/) |
| **Uttarakhand valley boundaries**| Open | Unlimited | Polygons for Garhwal district/valley mapping | [github.com/datameet/maps](https://github.com/datameet/maps) |

## UI Components

| Resource | License | Free Limit | Use For | URL |
| :--- | :--- | :--- | :--- | :--- |
| **Tailwind CSS** | MIT, free | Unlimited | Utility-first styling | [tailwindcss.com](https://tailwindcss.com/) |
| **Lucide React** | MIT, free | Unlimited | Scalable vector icons | [lucide.dev](https://lucide.dev/) |
| **Recharts** | MIT, free | Unlimited | Charts for equity bar, priority graphs | [recharts.org](https://recharts.org/) |
| **react-hot-toast** | MIT, free | Unlimited | Notifications for plan changes | [react-hot-toast.com](https://react-hot-toast.com/) |
| **Framer Motion** | MIT, free | Unlimited | Animations for plan-changed transitions | [framer.com/motion](https://www.framer.com/motion/) |
| **@radix-ui/react** | MIT, free | Unlimited | Accessible UI primitives | [radix-ui.com](https://www.radix-ui.com/) |

## Offline / PWA

| Resource | License | Free Limit | Use For | URL |
| :--- | :--- | :--- | :--- | :--- |
| **Workbox** | MIT, free | Unlimited | Service worker generation | [developer.chrome.com/docs/workbox](https://developer.chrome.com/docs/workbox/) |
| **idb** | MIT, free | Unlimited | IndexedDB wrapper for offline queue | [npmjs.com/package/idb](https://www.npmjs.com/package/idb) |
| **leaflet-offline** | MIT, free | Unlimited | Cache map tiles for offline use | [github.com/robertleeplummerjr/Leaflet.offline](https://github.com/robertleeplummerjr/Leaflet.offline) |

---

## Setup in First 2 Hours
1. **Supabase**: create project, enable PostGIS, run schema migrations.
2. **Vercel**: connect GitHub repo, deploy blank React app.
3. **Railway**: deploy Express server with health endpoint.
4. **Leaflet + OSM**: test map renders with test zone polygon.
5. **Google Gemini Flash API (Free Tier)**: get key, test one extraction call.
6. **OpenRouteService**: get free API key, test `/directions` endpoint.
7. **Web Speech API**: test voice input in Chrome.

## What NOT to spend time on
- ✗ No Docker/Kubernetes setup
- ✗ No real SMS gateway (simulate with form)
- ✗ No real NDRF API integration (use seed data)
- ✗ No satellite imagery processing
- ✗ No real-time weather feeds
- ✗ No blockchain
- ✗ No multi-tenant enterprise auth (Supabase roles is enough)
- ✗ No mobile app (PWA is sufficient)

## Demo Data Sources
- **Uttarakhand flood zones**: Rudraprayag, Srinagar Garhwal, Joshimath, Karnaprayag, Guptkashi (use OSM Nominatim for coords)
- **Hospital locations**: query OSM `[amenity=hospital]` in Garhwal / Rishikesh via Overpass Turbo.
- **Seed resource counts**: inspired by SDRF Uttarakhand & NDRF 8th Battalion SOP.
- **Population estimates**: approximate from Uttarakhand State Disaster Management Authority atlas.
