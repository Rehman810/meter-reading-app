# Electricity Usage Tracker Backend

This is the backend for the "Electricity Usage Tracker" app. It's built using Node.js, Express, MongoDB, and uses Google's Gemini API for AI-based OCR data extraction from electricity bills and meter readings. Images are uploaded directly to Cloudinary.

## Requirements

- Node.js (v18+ recommended)
- MongoDB

## Tech Stack

- **Server:** Node.js, Express
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT, bcrypt
- **File Upload:** Multer (memory storage), Cloudinary
- **AI Extraction:** Google Gemini Multimodal API (\`@google/genai\`)
- **Validation:** Zod
- **Rate Limiting:** express-rate-limit

## Setup and Running Locally

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Environment Variables:**
   Rename \`.env.example\` to \`.env\` and fill in the required keys:
   - \`MONGO_URI\`: Your MongoDB connection string.
   - \`JWT_SECRET\`: A random string for JWT signing.
   - \`CLOUDINARY_CLOUD_NAME\`, \`CLOUDINARY_API_KEY\`, \`CLOUDINARY_API_SECRET\`: Credentials from your Cloudinary dashboard.
   - \`GEMINI_API_KEY\`: API key from Google AI Studio.
   - \`PORT\`: Optional (defaults to 5000).

3. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   The server will start on \`http://localhost:5000\` (or your configured port) and will automatically restart on file changes using \`nodemon\`.

## API Endpoints

### Auth
- \`POST /api/auth/register\` - Register a new user
- \`POST /api/auth/login\` - Login and receive a JWT

### Bills (Protected)
- \`POST /api/bills/upload\` (multipart/form-data with \`image\`) - Upload a bill, parse via AI, and save.
- \`GET /api/bills\` - Get paginated list of bills.
- \`GET /api/bills/:id\` - Get a specific bill by ID.

### Meter Readings (Protected)
- \`POST /api/meter-readings/upload\` (multipart/form-data with \`image\`) - Upload a meter reading, parse via AI, link to latest bill, and save.
- \`GET /api/meter-readings\` - Get paginated list of meter readings.

### Usage Stats (Protected)
- \`GET /api/usage/summary\` - Returns units used, daily average, projected monthly units, and estimated cost since the last bill.
- \`GET /api/usage/history\` - Returns the last 12 bills for charting usage trends.
