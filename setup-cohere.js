import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

console.log('🌱 GreenPulse Cohere Setup\n');

// Check if .env file exists
const envPath = '.env';
if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file...');
    const envContent = `# Database Configuration
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

# Cohere AI Configuration
COHERE_API_KEY=your_cohere_api_key_here
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created');
} else {
    console.log('✅ .env file already exists');
}

// Check if Cohere API key is set
if (!process.env.COHERE_API_KEY || process.env.COHERE_API_KEY === 'your_cohere_api_key_here') {
    console.log('\n⚠️  Cohere API key not configured');
    console.log('📋 To get started:');
    console.log('1. Go to https://cohere.ai/');
    console.log('2. Sign up for an account');
    console.log('3. Get your API key from the dashboard');
    console.log('4. Add it to your .env file: COHERE_API_KEY=your_actual_api_key');
} else {
    console.log('✅ Cohere API key is configured');
}

console.log('\n🚀 Next steps:');
console.log('1. Make sure your .env file has the correct COHERE_API_KEY');
console.log('2. Start the server: npm run dev');
console.log('3. Open your browser to: http://localhost:3001');
console.log('4. Test the Cohere embeddings interface!');

console.log('\n📚 Available endpoints:');
console.log('- GET  /api/cohere/health - Health check');
console.log('- POST /api/cohere/test-embedding - Basic embedding test');
console.log('- POST /api/cohere/test-embedding-debug - Debug embedding test');
console.log('- POST /api/cohere/test-recommendation-embedding - Recommendation embedding test');

console.log('\n🧪 Test commands:');
console.log('- node test-cohere.js (run all tests)');
console.log('- curl http://localhost:3001/api/cohere/health (health check)');

console.log('\n✨ Setup complete! Happy testing!');
