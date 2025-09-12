# 🌱 Vue Frontend Integration Guide for GreenPulse RAG System

This guide shows how to integrate the GreenPulse RAG recommendation system into a Vue.js frontend application.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [API Integration](#api-integration)
3. [Calculator Integration](#calculator-integration)
4. [Component Examples](#component-examples)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install axios
# or
yarn add axios
```

### 2. Create API Service

Create `src/services/recommendationService.js`:

```javascript
import axios from 'axios'

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://gp-backend-iter2.vercel.app/api'
  : 'http://localhost:3001/api'

const recommendationAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for AI processing
  headers: {
    'Content-Type': 'application/json'
  }
})

export const recommendationService = {
  // Generate personalized recommendations
  async generateRecommendations(data) {
    try {
      const response = await recommendationAPI.post('/recommendations/generate', data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  },

  // Search recommendations
  async searchRecommendations(query, category = null) {
    try {
      const response = await recommendationAPI.post('/recommendations/search', {
        query,
        category
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  },

  // Get recommendations by category
  async getRecommendationsByCategory(category, limit = 10) {
    try {
      const response = await recommendationAPI.get(`/recommendations/category/${category}?limit=${limit}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  },

  // Get emission factors
  async getEmissionFactors(category) {
    try {
      const response = await recommendationAPI.get(`/recommendations/emission-factors/${category}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  },

  // Health check
  async healthCheck() {
    try {
      const response = await recommendationAPI.get('/recommendations/health')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  },

  // Error handling
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        type: 'API_ERROR',
        message: error.response.data.message || 'API request failed',
        status: error.response.status,
        data: error.response.data
      }
    } else if (error.request) {
      // Request was made but no response received
      return {
        type: 'NETWORK_ERROR',
        message: 'Unable to connect to recommendation service',
        status: 0
      }
    } else {
      // Something else happened
      return {
        type: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
        status: 0
      }
    }
  }
}
```

## 🔧 API Integration

### Basic Usage in Vue Component

```vue
<template>
  <div class="recommendation-container">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Generating personalized recommendations...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <h3>⚠️ Unable to generate recommendations</h3>
      <p>{{ error.message }}</p>
      <button @click="retryRecommendations">Try Again</button>
    </div>
    
    <div v-else-if="recommendations" class="recommendations">
      <div class="summary">
        <h2>📊 Your Carbon Footprint Summary</h2>
        <div v-html="recommendations.summary"></div>
      </div>
      
      <div class="recommendations-list">
        <h2>🌱 Personalized Recommendations</h2>
        <div v-html="recommendations.recommendations"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { recommendationService } from '@/services/recommendationService'

export default {
  name: 'RecommendationDisplay',
  props: {
    calculationData: {
      type: Object,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    totalEmissions: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      error: null,
      recommendations: null
    }
  },
  methods: {
    async generateRecommendations() {
      this.loading = true
      this.error = null
      this.recommendations = null
      
      try {
        const data = {
          category: this.category,
          totalEmissions: this.totalEmissions,
          calculationData: this.calculationData
        }
        
        const response = await recommendationService.generateRecommendations(data)
        this.recommendations = response.data
      } catch (error) {
        this.error = error
        console.error('Recommendation generation failed:', error)
      } finally {
        this.loading = false
      }
    },
    
    retryRecommendations() {
      this.generateRecommendations()
    }
  },
  
  watch: {
    calculationData: {
      handler() {
        if (this.calculationData && this.totalEmissions) {
          this.generateRecommendations()
        }
      },
      deep: true,
      immediate: true
    }
  }
}
</script>

<style scoped>
.loading {
  text-align: center;
  padding: 2rem;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  background-color: #ffebee;
  border: 1px solid #f44336;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.recommendations {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
}

.summary, .recommendations-list {
  margin-bottom: 2rem;
}

.summary h2, .recommendations-list h2 {
  color: #2e7d32;
  margin-bottom: 1rem;
}
</style>
```

## 🧮 Calculator Integration

### Travel Calculator Integration

```javascript
// Travel Calculator Data Structure
const travelCalculationData = {
  // Private transport
  privateTransport: [
    {
      vehicleType: 'car', // car, motorcycle, truck
      distance: 50, // km
      fuelType: 'petrol', // petrol, diesel, electric
      passengers: 1,
      fuelEfficiency: 12 // km/liter (optional)
    }
  ],
  
  // Public transport
  publicTransport: [
    {
      transportType: 'bus', // bus, train, lrt, mrt
      distance: 20, // km
      frequency: 'daily' // daily, weekly, monthly
    }
  ],
  
  // Flights
  flights: [
    {
      origin: 'KUL',
      destination: 'SIN',
      class: 'economy', // economy, business, first
      passengers: 1
    }
  ]
}

// Generate recommendations for travel
const travelRecommendations = await recommendationService.generateRecommendations({
  category: 'travel',
  totalEmissions: 25.5, // kg CO2e
  calculationData: travelCalculationData
})
```

### Household Calculator Integration

```javascript
// Household Calculator Data Structure
const householdCalculationData = {
  // Electricity usage
  electricity: {
    monthlyKWh: 300,
    provider: 'TNB', // TNB, other
    renewablePercentage: 0 // 0-100
  },
  
  // Water usage
  water: {
    monthlyCubicMeters: 15,
    hasWaterHeater: true,
    hasSwimmingPool: false
  },
  
  // Gas usage
  gas: {
    monthlyCubicMeters: 20,
    type: 'natural_gas' // natural_gas, lpg
  },
  
  // Waste
  waste: {
    weeklyKg: 10,
    recyclingPercentage: 30 // 0-100
  }
}

// Generate recommendations for household
const householdRecommendations = await recommendationService.generateRecommendations({
  category: 'household',
  totalEmissions: 180.2, // kg CO2e
  calculationData: householdCalculationData
})
```

### Food Calculator Integration

```javascript
// Food Calculator Data Structure
const foodCalculationData = {
  // Meat consumption
  meat: {
    beef: { weeklyKg: 0.5 },
    pork: { weeklyKg: 0.3 },
    chicken: { weeklyKg: 1.0 },
    fish: { weeklyKg: 0.8 }
  },
  
  // Dairy products
  dairy: {
    milk: { weeklyLiters: 2 },
    cheese: { weeklyKg: 0.2 },
    yogurt: { weeklyKg: 0.5 }
  },
  
  // Fruits and vegetables
  produce: {
    localPercentage: 70, // 0-100
    organicPercentage: 20, // 0-100
    weeklyKg: 5
  },
  
  // Eating habits
  habits: {
    eatingOutFrequency: 'weekly', // daily, weekly, monthly, rarely
    foodWastePercentage: 10 // 0-100
  }
}

// Generate recommendations for food
const foodRecommendations = await recommendationService.generateRecommendations({
  category: 'food',
  totalEmissions: 45.8, // kg CO2e
  calculationData: foodCalculationData
})
```

### Shopping Calculator Integration

```javascript
// Shopping Calculator Data Structure
const shoppingCalculationData = {
  // Clothing
  clothing: {
    monthlySpend: 200, // RM
    secondHandPercentage: 20, // 0-100
    fastFashionPercentage: 60 // 0-100
  },
  
  // Electronics
  electronics: {
    monthlySpend: 150, // RM
    averageLifespan: 3, // years
    repairFrequency: 'rarely' // frequently, sometimes, rarely, never
  },
  
  // General merchandise
  general: {
    monthlySpend: 300, // RM
    onlineShoppingPercentage: 40, // 0-100
    packagingWaste: 'moderate' // low, moderate, high
  },
  
  // Home goods
  homeGoods: {
    monthlySpend: 100, // RM
    energyEfficientPercentage: 30 // 0-100
  }
}

// Generate recommendations for shopping
const shoppingRecommendations = await recommendationService.generateRecommendations({
  category: 'shopping',
  totalEmissions: 85.3, // kg CO2e
  calculationData: shoppingCalculationData
})
```

## 🧩 Component Examples

### Complete Calculator Component

```vue
<template>
  <div class="carbon-calculator">
    <div class="calculator-header">
      <h1>🌱 {{ categoryTitle }} Carbon Calculator</h1>
      <p>Calculate your carbon footprint and get personalized recommendations</p>
    </div>
    
    <div class="calculator-form">
      <!-- Calculator inputs based on category -->
      <component 
        :is="calculatorComponent" 
        v-model="calculationData"
        @calculate="handleCalculation"
      />
    </div>
    
    <div v-if="emissionsCalculated" class="results-section">
      <div class="emissions-summary">
        <h2>📊 Your Carbon Footprint</h2>
        <div class="emissions-display">
          <span class="emissions-value">{{ totalEmissions.toFixed(2) }}</span>
          <span class="emissions-unit">kg CO₂e</span>
        </div>
      </div>
      
      <RecommendationDisplay
        :calculation-data="calculationData"
        :category="category"
        :total-emissions="totalEmissions"
      />
    </div>
  </div>
</template>

<script>
import RecommendationDisplay from '@/components/RecommendationDisplay.vue'
import TravelCalculator from '@/components/calculators/TravelCalculator.vue'
import HouseholdCalculator from '@/components/calculators/HouseholdCalculator.vue'
import FoodCalculator from '@/components/calculators/FoodCalculator.vue'
import ShoppingCalculator from '@/components/calculators/ShoppingCalculator.vue'

export default {
  name: 'CarbonCalculator',
  components: {
    RecommendationDisplay,
    TravelCalculator,
    HouseholdCalculator,
    FoodCalculator,
    ShoppingCalculator
  },
  props: {
    category: {
      type: String,
      required: true,
      validator: value => ['travel', 'household', 'food', 'shopping'].includes(value)
    }
  },
  data() {
    return {
      calculationData: {},
      totalEmissions: 0,
      emissionsCalculated: false
    }
  },
  computed: {
    categoryTitle() {
      const titles = {
        travel: 'Travel',
        household: 'Household',
        food: 'Food',
        shopping: 'Shopping'
      }
      return titles[this.category]
    },
    
    calculatorComponent() {
      const components = {
        travel: 'TravelCalculator',
        household: 'HouseholdCalculator',
        food: 'FoodCalculator',
        shopping: 'ShoppingCalculator'
      }
      return components[this.category]
    }
  },
  methods: {
    handleCalculation(emissions) {
      this.totalEmissions = emissions
      this.emissionsCalculated = true
    }
  }
}
</script>
```

### Search Recommendations Component

```vue
<template>
  <div class="recommendation-search">
    <div class="search-header">
      <h2>🔍 Search Recommendations</h2>
      <p>Find specific recommendations for your sustainability goals</p>
    </div>
    
    <div class="search-form">
      <div class="search-input">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="e.g., 'reduce electricity bill', 'eco-friendly transport'"
          @keyup.enter="performSearch"
        />
        <button @click="performSearch" :disabled="loading">
          {{ loading ? 'Searching...' : 'Search' }}
        </button>
      </div>
      
      <div class="category-filter">
        <label>Category:</label>
        <select v-model="selectedCategory">
          <option value="">All Categories</option>
          <option value="travel">Travel</option>
          <option value="household">Household</option>
          <option value="food">Food</option>
          <option value="shopping">Shopping</option>
        </select>
      </div>
    </div>
    
    <div v-if="searchResults" class="search-results">
      <h3>Search Results</h3>
      <div v-for="result in searchResults" :key="result.id" class="result-item">
        <h4>{{ result.title }}</h4>
        <p>{{ result.content }}</p>
        <div class="result-meta">
          <span class="category">{{ result.category }}</span>
          <span class="impact">{{ result.impact_level }} impact</span>
          <span class="difficulty">{{ result.difficulty }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { recommendationService } from '@/services/recommendationService'

export default {
  name: 'RecommendationSearch',
  data() {
    return {
      searchQuery: '',
      selectedCategory: '',
      loading: false,
      searchResults: null
    }
  },
  methods: {
    async performSearch() {
      if (!this.searchQuery.trim()) return
      
      this.loading = true
      try {
        const results = await recommendationService.searchRecommendations(
          this.searchQuery,
          this.selectedCategory || null
        )
        this.searchResults = results.data
      } catch (error) {
        console.error('Search failed:', error)
        this.$emit('error', error)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
```

## ⚠️ Error Handling

### Global Error Handler

```javascript
// src/utils/errorHandler.js
export const handleRecommendationError = (error, context = '') => {
  console.error(`Recommendation Error ${context}:`, error)
  
  switch (error.type) {
    case 'API_ERROR':
      if (error.status === 429) {
        return {
          title: 'Rate Limit Exceeded',
          message: 'Too many requests. Please wait a moment and try again.',
          action: 'retry'
        }
      } else if (error.status >= 500) {
        return {
          title: 'Service Unavailable',
          message: 'The recommendation service is temporarily unavailable. Please try again later.',
          action: 'retry'
        }
      } else {
        return {
          title: 'Request Failed',
          message: error.message || 'Unable to process your request.',
          action: 'retry'
        }
      }
      
    case 'NETWORK_ERROR':
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the recommendation service. Please check your internet connection.',
        action: 'retry'
      }
      
    default:
      return {
        title: 'Unexpected Error',
        message: 'Something went wrong. Please try again.',
        action: 'retry'
      }
  }
}
```

### Error Boundary Component

```vue
<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <h3>⚠️ {{ errorInfo.title }}</h3>
      <p>{{ errorInfo.message }}</p>
      <div class="error-actions">
        <button v-if="errorInfo.action === 'retry'" @click="retry">
          Try Again
        </button>
        <button @click="goHome">
          Go to Home
        </button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script>
import { handleRecommendationError } from '@/utils/errorHandler'

export default {
  name: 'RecommendationErrorBoundary',
  data() {
    return {
      hasError: false,
      errorInfo: null
    }
  },
  methods: {
    handleError(error, context = '') {
      this.errorInfo = handleRecommendationError(error, context)
      this.hasError = true
    },
    
    retry() {
      this.hasError = false
      this.errorInfo = null
      this.$emit('retry')
    },
    
    goHome() {
      this.$router.push('/')
    }
  }
}
</script>
```

## 🎯 Best Practices

### 1. Performance Optimization

```javascript
// Debounce search requests
import { debounce } from 'lodash'

export default {
  data() {
    return {
      searchQuery: '',
      debouncedSearch: null
    }
  },
  
  created() {
    this.debouncedSearch = debounce(this.performSearch, 300)
  },
  
  watch: {
    searchQuery() {
      this.debouncedSearch()
    }
  }
}
```

### 2. Caching Recommendations

```javascript
// Cache recommendations to avoid repeated API calls
const recommendationCache = new Map()

export const getCachedRecommendations = (key) => {
  return recommendationCache.get(key)
}

export const setCachedRecommendations = (key, data) => {
  recommendationCache.set(key, {
    data,
    timestamp: Date.now()
  })
}

export const isCacheValid = (key, maxAge = 5 * 60 * 1000) => { // 5 minutes
  const cached = recommendationCache.get(key)
  if (!cached) return false
  
  return (Date.now() - cached.timestamp) < maxAge
}
```

### 3. Loading States

```vue
<template>
  <div class="loading-container">
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
    <slot />
  </div>
</template>

<script>
export default {
  name: 'LoadingWrapper',
  props: {
    loading: Boolean,
    loadingMessage: {
      type: String,
      default: 'Loading...'
    }
  }
}
</script>
```

### 4. Accessibility

```vue
<template>
  <div class="recommendation-card" role="article" :aria-labelledby="`recommendation-${id}`">
    <h3 :id="`recommendation-${id}`">{{ title }}</h3>
    <p>{{ content }}</p>
    <div class="recommendation-meta" role="group" aria-label="Recommendation details">
      <span class="impact" :aria-label="`${impact_level} impact level`">
        Impact: {{ impact_level }}
      </span>
      <span class="difficulty" :aria-label="`${difficulty} difficulty level`">
        Difficulty: {{ difficulty }}
      </span>
    </div>
  </div>
</template>
```

## 🚀 Getting Started Checklist

- [ ] Install axios dependency
- [ ] Create recommendation service
- [ ] Set up error handling
- [ ] Create calculator components
- [ ] Implement recommendation display
- [ ] Add loading states
- [ ] Test with different calculator types
- [ ] Add accessibility features
- [ ] Implement caching (optional)
- [ ] Add search functionality (optional)

## 📞 Support

For issues or questions about the RAG system integration:

1. Check the API health endpoint: `GET /api/recommendations/health`
2. Verify your calculation data structure matches the expected format
3. Ensure your backend server is running on the correct port
4. Check browser console for detailed error messages

Happy coding! 🌱✨
