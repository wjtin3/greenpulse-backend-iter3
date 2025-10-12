# Frontend Integration Quick Start

**TL;DR:** Everything you need to integrate the Google Maps routing interface into your frontend.

---

## ⚡ 5-Minute Setup

### 1. Environment Variables (.env)

```env
GOOGLE_MAPS_API_KEY=your_key_here
DATABASE_URL=postgresql://user:pass@host:5432/db
API_PORT=3001
NODE_ENV=production
```

### 2. Run Setup Scripts

```bash
npm install
node scripts/importGTFS.js
node scripts/setupRealtimeSchema.js
node scripts/setupRouteCache.js
npm start
```

### 3. Verify Backend

```bash
# Should return Google Maps API key
curl http://localhost:3001/api/config/maps-key
```

### 4. Integrate Frontend

**Option A: Iframe (Easiest)**
```html
<iframe 
  src="http://localhost:3001/google-map-routing.html" 
  width="100%" 
  height="800px">
</iframe>
```

**Option B: Direct Link**
```html
<a href="http://localhost:3001/google-map-routing.html" target="_blank">
  Open Route Planner
</a>
```

**Done!** 🎉

---

## 🔌 Required Backend APIs

Your backend must expose these endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/config/maps-key` | Google Maps API key |
| `POST /api/routing/compare` | Private vehicle routes |
| `POST /api/routing/transit/plan` | Public transit routes |
| `GET /api/routing/realtime/vehicles-for-route` | Live vehicle positions |
| `GET /api/gtfs/realtime/vehicles/:category` | Background refresh |

**All endpoints are already implemented** in `routes/routing.js` and `routes/gtfs.js`.

---

## 🗺️ Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project
3. Enable:
   - Maps JavaScript API ✅
   - Places API ✅
   - Geocoding API ✅
4. Create API Key
5. Add to `.env`:
   ```env
   GOOGLE_MAPS_API_KEY=AIzaSy...
   ```

**Free Tier:** $200/month credit ([pricing](https://mapsplatform.google.com/pricing/))

---

## 🎨 Component Integration (Vue/React)

### Vue 3 Example:

```vue
<template>
  <iframe 
    src="http://localhost:3001/google-map-routing.html" 
    style="width: 100%; height: 800px; border: none;">
  </iframe>
</template>
```

### React Example:

```jsx
export default function MapRouting() {
  return (
    <iframe 
      src="http://localhost:3001/google-map-routing.html"
      style={{ width: '100%', height: '800px', border: 'none' }}
    />
  );
}
```

### Angular Example:

```html
<iframe 
  [src]="mapUrl" 
  style="width: 100%; height: 800px; border: none;">
</iframe>
```

```typescript
export class MapComponent {
  mapUrl = 'http://localhost:3001/google-map-routing.html';
}
```

---

## 📊 Features Included

✅ Multi-modal routing (drive, transit, walk, bike)  
✅ Real-time bus tracking  
✅ 5 sorting options (fastest, emissions, distance, convenience, balanced)  
✅ GPS location support  
✅ 2-minute caching (optimized for free tier)  
✅ Live vehicle markers on map  
✅ Distance-based transit prioritization  
✅ Concurrent search handling  

---

## 🔧 Customization

### Change Backend URL:

If your backend is on a different domain:

```javascript
// Edit fetch calls in google-map-routing.html
const API_BASE = 'https://your-backend.com';

fetch(`${API_BASE}/api/config/maps-key`);
fetch(`${API_BASE}/api/routing/compare`, { ... });
```

### Enable CORS:

```javascript
// In server.js
app.use(cors({
  origin: 'https://your-frontend.com'
}));
```

---

## 🚨 Troubleshooting

### Map doesn't load?
```bash
# Check API key
curl http://localhost:3001/api/config/maps-key

# Should return: {"apiKey":"AIzaSy..."}
```

### No routes found?
```bash
# Import GTFS data
node scripts/importGTFS.js
```

### Live vehicles not showing?
```bash
# Setup real-time tracking
node scripts/setupRealtimeSchema.js
node scripts/realtimeUpdater.js
```

### CORS errors?
```javascript
// Add your frontend domain to CORS whitelist in server.js
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-domain.com']
}));
```

---

## 📖 Full Documentation

For advanced integration (custom components, API details, optimization):

👉 [**Full Integration Guide**](./guides/FRONTEND_MAP_INTEGRATION_GUIDE.md)

---

## ✅ Checklist

- [ ] `.env` file configured with `GOOGLE_MAPS_API_KEY`
- [ ] Database URL configured
- [ ] GTFS data imported
- [ ] Real-time schema set up
- [ ] Backend server running on port 3001
- [ ] `/api/config/maps-key` returns API key
- [ ] Map loads at `http://localhost:3001/google-map-routing.html`
- [ ] Can search routes (origin → destination)
- [ ] Live vehicle tracking works

---

## 🎉 That's It!

Your map is ready to use. Embed it in your frontend and start routing!

**Need help?** See [Full Integration Guide](./guides/FRONTEND_MAP_INTEGRATION_GUIDE.md)

