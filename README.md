# GreenPulse Backend API

This is the backend API for the GreenPulse carbon footprint calculator application.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory with your Neon database credentials:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:port/database_name
DB_HOST=your-neon-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password

# API Configuration
API_PORT=3001

# Environment
NODE_ENV=development
```

### 3. Database Setup

Run the database migration to create the required tables:

```bash
npm run migrate
```

### 4. Start the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /health` - Check if the API is running

### Carbon Footprint Calculations
- `POST /api/household` - Save household carbon footprint calculation
- `POST /api/travel` - Save travel carbon footprint calculation
- `GET /api/session/:sessionId` - Get all calculations for a session
- `GET /api/all` - Get all calculations (with pagination)
- `DELETE /api/:id` - Delete a specific calculation

## Database Schema

### carbon_footprint_calculations
- `id` - Primary key
- `session_id` - Unique session identifier
- `calculation_type` - 'household' or 'travel'
- `data` - JSONB field containing input data
- `results` - JSONB field containing calculation results
- `total_footprint` - Total carbon footprint value
- `created_at` - Timestamp when record was created
- `updated_at` - Timestamp when record was last updated

### user_sessions
- `id` - Primary key
- `session_id` - Unique session identifier
- `ip_address` - User's IP address
- `user_agent` - User's browser information
- `created_at` - Session creation timestamp
- `last_activity` - Last activity timestamp
