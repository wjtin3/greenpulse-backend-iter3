# Routing Service - Frontend Integration Guide

## Overview

This guide shows how to integrate the Routing Service with your Vue 3 frontend to display carbon emission comparisons for different routes.

## Frontend Location

Your frontend is in: `C:\GitRepo\greenpulse-frontend-iteration3`

##  Installation

### 1. Install Required Packages

```bash
cd C:\GitRepo\greenpulse-frontend-iteration3
npm install leaflet vue-leaflet
```

**Leaflet** is a lightweight, open-source map library perfect for displaying routes.

### 2. Add Leaflet CSS

Add to `index.html`:
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

## API Service Setup

Create a new service file for routing API calls:

**File: `src/services/routingApi.js`**

```javascript
import api from './api.js'

/**
 * Compare carbon emissions across transport modes
 */
export const compareRoutes = async (origin, destination, options = {}) => {
  try {
    const response = await api.post('/api/routing/compare', {
      origin,
      destination,
      options,
      userId: options.userId || null
    })
    return response.data
  } catch (error) {
    console.error('Error comparing routes:', error)
    throw error
  }
}

/**
 * Quick route comparison (top 5 options only)
 */
export const quickCompare = async (origin, destination) => {
  try {
    const response = await api.post('/api/routing/compare/quick', {
      origin,
      destination
    })
    return response.data
  } catch (error) {
    console.error('Error in quick comparison:', error)
    throw error
  }
}

/**
 * Calculate distance between two points
 */
export const calculateDistance = async (origin, destination) => {
  try {
    const response = await api.get('/api/routing/distance', {
      params: {
        originLat: origin.latitude,
        originLon: origin.longitude,
        destLat: destination.latitude,
        destLon: destination.longitude
      }
    })
    return response.data
  } catch (error) {
    console.error('Error calculating distance:', error)
    throw error
  }
}

/**
 * Calculate emissions for specific mode and distance
 */
export const calculateEmissions = async (distance, mode, size, fuelType) => {
  try {
    const response = await api.post('/api/routing/emissions', {
      distance,
      mode,
      size,
      fuelType
    })
    return response.data
  } catch (error) {
    console.error('Error calculating emissions:', error)
    throw error
  }
}

/**
 * Get user's route history
 */
export const getRouteHistory = async (userId, limit = 10) => {
  try {
    const response = await api.get(`/api/routing/history/${userId}`, {
      params: { limit }
    })
    return response.data
  } catch (error) {
    console.error('Error getting route history:', error)
    throw error
  }
}

/**
 * Get all emission factors
 */
export const getEmissionFactors = async () => {
  try {
    const response = await api.get('/api/routing/emission-factors')
    return response.data
  } catch (error) {
    console.error('Error getting emission factors:', error)
    throw error
  }
}
```

## Vue Component Example

### Route Comparison Component

**File: `src/views/RouteComparison.vue`**

```vue
<template>
  <div class="route-comparison">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Route Carbon Comparison</h1>

      <!-- Location Input -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="location-input">
          <label class="block text-sm font-medium mb-2">Origin</label>
          <input
            v-model="origin.name"
            @click="selectingLocation = 'origin'"
            placeholder="Click on map or enter coordinates"
            class="w-full px-4 py-2 border rounded-lg"
          />
          <div class="text-xs text-gray-500 mt-1">
            {{ origin.latitude ? `${origin.latitude.toFixed(4)}, ${origin.longitude.toFixed(4)}` : 'Not set' }}
          </div>
        </div>

        <div class="location-input">
          <label class="block text-sm font-medium mb-2">Destination</label>
          <input
            v-model="destination.name"
            @click="selectingLocation = 'destination'"
            placeholder="Click on map or enter coordinates"
            class="w-full px-4 py-2 border rounded-lg"
          />
          <div class="text-xs text-gray-500 mt-1">
            {{ destination.latitude ? `${destination.latitude.toFixed(4)}, ${destination.longitude.toFixed(4)}` : 'Not set' }}
          </div>
        </div>
      </div>

      <!-- Options -->
      <div class="mb-6">
        <label class="block text-sm font-medium mb-2">Comparison Type</label>
        <div class="flex gap-4">
          <button
            @click="comparisonType = 'full'"
            :class="comparisonType === 'full' ? 'bg-green-600 text-white' : 'bg-gray-200'"
            class="px-4 py-2 rounded-lg"
          >
            Full Comparison
          </button>
          <button
            @click="comparisonType = 'quick'"
            :class="comparisonType === 'quick' ? 'bg-green-600 text-white' : 'bg-gray-200'"
            class="px-4 py-2 rounded-lg"
          >
            Quick (Top 5)
          </button>
        </div>
      </div>

      <!-- Compare Button -->
      <button
        @click="compareRoutes"
        :disabled="!canCompare || isLoading"
        class="w-full md:w-auto px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {{ isLoading ? 'Comparing...' : 'Compare Routes' }}
      </button>

      <!-- Map -->
      <div class="mb-6">
        <div id="map" class="h-96 rounded-lg shadow-lg"></div>
      </div>

      <!-- Results -->
      <div v-if="results" class="results">
        <h2 class="text-2xl font-bold mb-4">Comparison Results</h2>

        <!-- Summary -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-green-50 p-4 rounded-lg">
            <div class="text-sm text-gray-600">Route Distance</div>
            <div class="text-2xl font-bold text-green-600">
              {{ results.routeDistance.toFixed(2) }} km
            </div>
          </div>

          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="text-sm text-gray-600">Best Option</div>
            <div class="text-lg font-bold text-blue-600">
              {{ results.bestOption.name }}
            </div>
            <div class="text-sm text-gray-500">
              {{ results.bestOption.emissions.toFixed(3) }} kg CO2
            </div>
          </div>

          <div class="bg-red-50 p-4 rounded-lg">
            <div class="text-sm text-gray-600">Worst Option</div>
            <div class="text-lg font-bold text-red-600">
              {{ results.worstOption.name }}
            </div>
            <div class="text-sm text-gray-500">
              {{ results.worstOption.emissions.toFixed(3) }} kg CO2
            </div>
          </div>
        </div>

        <!-- Transport Options List -->
        <div class="space-y-3">
          <div
            v-for="scenario in results.scenarios"
            :key="scenario.id"
            class="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-2xl">{{ getIcon(scenario.mode) }}</span>
                  <div>
                    <div class="font-semibold">{{ scenario.name }}</div>
                    <div class="text-sm text-gray-500">{{ scenario.category }}</div>
                  </div>
                  <span
                    v-if="scenario.rank === 1"
                    class="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                  >
                    Best Choice
                  </span>
                </div>

                <div class="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div class="text-gray-500">Distance</div>
                    <div class="font-medium">{{ scenario.distance.toFixed(2) }} km</div>
                  </div>
                  <div>
                    <div class="text-gray-500">Duration</div>
                    <div class="font-medium">{{ Math.round(scenario.duration) }} min</div>
                  </div>
                  <div>
                    <div class="text-gray-500">Emissions</div>
                    <div class="font-medium">{{ scenario.emissions.toFixed(3) }} kg CO2</div>
                  </div>
                </div>

                <!-- Emission Bar -->
                <div class="mt-3">
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full"
                      :class="getEmissionBarColor(scenario.rank)"
                      :style="{ width: `${scenario.emissionsVsWorst}%` }"
                    ></div>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    {{ scenario.emissionsVsWorst }}% of worst option
                    <span v-if="scenario.savingsVsWorst > 0">
                      · Saves {{ scenario.savingsVsWorst.toFixed(3) }} kg CO2
                    </span>
                  </div>
                </div>
              </div>

              <div class="text-right">
                <div class="text-3xl font-bold" :class="getRankColor(scenario.rank)">
                  #{{ scenario.rank }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Calculating carbon emissions...</p>
      </div>

      <!-- Error State -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="text-red-800 font-medium">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { compareRoutes as apiCompareRoutes, quickCompare } from '@/services/routingApi'
import L from 'leaflet'

// Data
const origin = ref({ latitude: null, longitude: null, name: '' })
const destination = ref({ latitude: null, longitude: null, name: '' })
const selectingLocation = ref(null)
const comparisonType = ref('quick')
const results = ref(null)
const isLoading = ref(false)
const error = ref(null)
let map = null
let originMarker = null
let destinationMarker = null
let routeLine = null

// Computed
const canCompare = computed(() => {
  return origin.value.latitude && origin.value.longitude &&
         destination.value.latitude && destination.value.longitude
})

// Methods
const initMap = () => {
  // Initialize Leaflet map centered on KL
  map = L.map('map').setView([3.1390, 101.6869], 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  // Click handler for setting locations
  map.on('click', (e) => {
    if (selectingLocation.value === 'origin') {
      setOrigin(e.latlng.lat, e.latlng.lng)
    } else if (selectingLocation.value === 'destination') {
      setDestination(e.latlng.lat, e.latlng.lng)
    }
  })
}

const setOrigin = (lat, lng) => {
  origin.value = { latitude: lat, longitude: lng, name: 'Origin' }

  if (originMarker) map.removeLayer(originMarker)
  originMarker = L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    })
  }).addTo(map)

  selectingLocation.value = null
}

const setDestination = (lat, lng) => {
  destination.value = { latitude: lat, longitude: lng, name: 'Destination' }

  if (destinationMarker) map.removeLayer(destinationMarker)
  destinationMarker = L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    })
  }).addTo(map)

  selectingLocation.value = null
}

const compareRoutes = async () => {
  isLoading.value = true
  error.value = null
  results.value = null

  try {
    let response
    if (comparisonType.value === 'quick') {
      response = await quickCompare(origin.value, destination.value)
    } else {
      response = await apiCompareRoutes(origin.value, destination.value)
    }

    if (response.success) {
      results.value = response.data

      // Draw route on map
      if (routeLine) map.removeLayer(routeLine)
      if (results.value.scenarios[0].geometry) {
        const coords = results.value.scenarios[0].geometry.coordinates.map(c => [c[1], c[0]])
        routeLine = L.polyline(coords, { color: 'blue', weight: 3 }).addTo(map)
        map.fitBounds(routeLine.getBounds())
      }
    } else {
      error.value = 'Failed to compare routes. Please try again.'
    }
  } catch (err) {
    error.value = err.message || 'An error occurred'
  } finally {
    isLoading.value = false
  }
}

const getIcon = (mode) => {
  const icons = {
    car: '🚗',
    motorcycle: '🏍️',
    bus: '🚌',
    mrt: '🚇',
    lrt: '🚈',
    train: '🚆',
    bicycle: '🚲',
    walking: '🚶'
  }
  return icons[mode] || '🚗'
}

const getRankColor = (rank) => {
  if (rank === 1) return 'text-green-600'
  if (rank <= 3) return 'text-blue-600'
  if (rank <= 5) return 'text-yellow-600'
  return 'text-gray-600'
}

const getEmissionBarColor = (rank) => {
  if (rank === 1) return 'bg-green-500'
  if (rank <= 3) return 'bg-blue-500'
  if (rank <= 5) return 'bg-yellow-500'
  return 'bg-red-500'
}

// Lifecycle
onMounted(() => {
  initMap()
})
</script>

<style scoped>
#map {
  height: 400px;
}
</style>
```

## Add Route to Router

**File: `src/router/index.ts`**

```typescript
import RouteComparison from '../views/RouteComparison.vue'

const routes = [
  // ... existing routes
  {
    path: '/route-comparison',
    name: 'RouteComparison',
    component: RouteComparison
  }
]
```

## Quick Integration Example

If you want a simpler integration without a map:

**File: `src/views/QuickRouteCompare.vue`**

```vue
<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold mb-4">Quick Route Comparison</h2>

    <!-- Manual Coordinate Input -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label>Origin Lat:</label>
        <input v-model.number="origin.latitude" type="number" step="0.0001" class="w-full border p-2" />
      </div>
      <div>
        <label>Origin Lon:</label>
        <input v-model.number="origin.longitude" type="number" step="0.0001" class="w-full border p-2" />
      </div>
      <div>
        <label>Dest Lat:</label>
        <input v-model.number="destination.latitude" type="number" step="0.0001" class="w-full border p-2" />
      </div>
      <div>
        <label>Dest Lon:</label>
        <input v-model.number="destination.longitude" type="number" step="0.0001" class="w-full border p-2" />
      </div>
    </div>

    <button @click="compare" class="bg-green-600 text-white px-6 py-2 rounded">
      Compare
    </button>

    <!-- Results -->
    <div v-if="results" class="mt-6 space-y-2">
      <div v-for="scenario in results.scenarios" :key="scenario.id" class="border p-4 rounded">
        <div class="font-bold">{{ scenario.name }}</div>
        <div>Emissions: {{ scenario.emissions.toFixed(3) }} kg CO2</div>
        <div>Distance: {{ scenario.distance.toFixed(2) }} km</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { quickCompare } from '@/services/routingApi'

const origin = ref({ latitude: 3.1390, longitude: 101.6869 })
const destination = ref({ latitude: 3.1570, longitude: 101.7120 })
const results = ref(null)

const compare = async () => {
  const response = await quickCompare(origin.value, destination.value)
  if (response.success) {
    results.value = response.data
  }
}
</script>
```

## Testing

### Test in Browser Console

```javascript
// Test quick comparison
fetch('/api/routing/compare/quick', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    origin: { latitude: 3.1390, longitude: 101.6869 },
    destination: { latitude: 3.1570, longitude: 101.7120 }
  })
})
.then(r => r.json())
.then(console.log)
```

## Next Steps

1. Add the routing service files to your backend
2. Run `npm run setup-routing` to create database schema
3. Install Leaflet in your frontend
4. Add the Vue component and API service
5. Test the integration
6. Customize styling to match your design

## Support

For questions or issues:
- Backend API docs: `guides/ROUTING_SERVICE_DOCUMENTATION.md`
- Test with Postman first
- Check browser console for errors
- Verify API_URL in your `.env` file

Happy coding! 🚗🌱

