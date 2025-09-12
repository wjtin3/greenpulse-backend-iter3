# Complete Deployment Guide: GreenPulse Backend on Vercel

This guide covers deploying the GreenPulse carbon footprint calculator backend on Vercel.

## 🏗️ Architecture Overview

- **Backend**: Node.js + Express → Vercel (Serverless Functions)
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle ORM
- **AI Services**: Cohere (Embeddings) + Groq (LLM)
- **RAG System**: Vector-based recommendations

## 📁 Project Structure

```
greenpulse-backend-iter2/
├── server.js                     # Express server (Vercel entry point)
├── vercel.json                   # Vercel configuration
├── config/
│   └── database.js              # Database connection
├── db/
│   └── schema.js                # Drizzle schema
├── routes/                      # API routes
│   ├── carbonFootprint.js       # Calculator APIs
│   ├── cohere.js               # Cohere embedding APIs
│   ├── groq.js                 # Groq LLM APIs
│   └── recommendations.js       # RAG recommendation APIs
├── services/                    # Business logic
│   ├── cohereService.js
│   ├── groqService.js
│   ├── recommendationService.js
│   └── vectorService.js
├── scripts/                     # Database setup scripts
└── package.json                 # Dependencies
```

## 🚀 Deployment Steps

### 1. Backend Deployment

#### Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Import your repository** (`greenpulse-backend-iter2`)
3. **Vercel will automatically detect** the Node.js project
4. **Set environment variables** (see Environment Variables section)
5. **Deploy** - Vercel will use `server.js` as the entry point

**How it works:**
- **Vercel detects** `server.js` as the main file
- **Uses `vercel.json`** for configuration
- **Creates serverless functions** from your Express app
- **Routes all requests** to the Express app

**Benefits:**
- ✅ Single repository to manage
- ✅ Shared code and configuration
- ✅ Easier to keep frontend and backend in sync
- ✅ Simpler CI/CD setup

#### Option B: Different Vercel Accounts

Deploy frontend and backend to separate Vercel accounts:

**Frontend Account:**
1. **Go to [vercel.com](https://vercel.com)** (Account A)
2. **Import your repository** (`greenpulse-frontend-v`)
3. **Deploy** - uses root directory by default

**Backend Account:**
1. **Go to [vercel.com](https://vercel.com)** (Account B)
2. **Import the same repository** (`greenpulse-frontend-v`)
3. **Set "Root Directory"** to `backend`
4. **Deploy** - uses backend folder

**Benefits:**
- ✅ Separate billing and usage limits
- ✅ Different team access permissions
- ✅ Independent deployment schedules
- ✅ Separate environment variables

#### Option C: Separate Repository

Only use this if you want to:
- Completely separate the codebases
- Have different teams working on each
- Use different version control

1. **Create a new repository** for your backend
2. **Copy backend files** to the new repo
3. **Deploy separately** to Vercel

### 3. Database Setup

#### Step 1: Run Migrations
```bash
cd backend
npm install
npm run db:migrate
```

#### Step 2: Import CSV Data
```bash
npm run import-csv-quoted
```

### 4. Environment Variables

#### Backend (Vercel Dashboard)
Set these in your Vercel project settings:

```env
DATABASE_URL=postgresql://your_username:your_password@your-host.region.provider.com/your_database?sslmode=require
NODE_ENV=production
```

#### Frontend (Vercel Dashboard)
Set these in your frontend Vercel project:

```env
VITE_API_BASE_URL=https://your-backend-project.vercel.app/api
```

## 🔧 Configuration Files

### Frontend `vercel.json` (Root)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Backend `vercel.json` (backend/)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Frontend API Configuration (`src/services/api.js`)
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})
```

## 🌐 URLs After Deployment

- **Frontend**: `https://greenpulse-frontend-v.vercel.app`
- **Backend**: `https://your-backend-project.vercel.app`
- **API Base**: `https://your-backend-project.vercel.app/api`

## 🔄 Development vs Production

### Development
```bash
# Frontend
npm run dev          # http://localhost:5173

# Backend  
cd backend
npm run dev          # http://localhost:3001
```

### Production
- Frontend: Automatically deployed on Vercel
- Backend: Deploy to Vercel with environment variables
- Database: Neon PostgreSQL (same for both)

## 🛠️ Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS includes your Vercel frontend URL
   - Check environment variables are set correctly

2. **Database Connection**
   - Verify `DATABASE_URL` is correct in Vercel
   - Ensure Neon database is accessible

3. **API Not Found**
   - Check `VITE_API_BASE_URL` in frontend environment
   - Verify backend deployment was successful

4. **Build Failures**
   - Check Node.js version compatibility
   - Ensure all dependencies are in `package.json`

### Debugging Commands

```bash
# Check backend logs in Vercel dashboard
# Check frontend build logs in Vercel dashboard

# Local testing
curl https://your-backend-project.vercel.app/api/emission-factors/food
```

## 📊 Monitoring

### Vercel Analytics
- Enable Vercel Analytics for both frontend and backend
- Monitor API response times and errors

### Database Monitoring
- Use Neon dashboard to monitor database performance
- Set up alerts for connection issues

## 🔐 Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use Vercel's environment variable system

2. **CORS**
   - Only allow your frontend domain
   - Remove localhost in production

3. **Rate Limiting**
   - Backend includes rate limiting middleware
   - Monitor for abuse

## 🚀 Next Steps

1. **Choose deployment approach**:
   - **Option A**: Same Vercel account (monorepo) - recommended
   - **Option B**: Different Vercel accounts (same repo)
   - **Option C**: Separate repositories
2. **Deploy backend** to Vercel
3. **Set environment variables** in both projects
4. **Test API endpoints** from frontend
5. **Monitor performance** and errors
6. **Set up custom domain** (optional)

## 📞 Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Neon Docs**: [neon.tech/docs](https://neon.tech/docs)
- **Drizzle Docs**: [orm.drizzle.team](https://orm.drizzle.team)
