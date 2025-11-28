# FinSightAi Backend API

Backend server for investment analysis using Google Gemini AI.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```bash
cp .env.example .env
```

3. Add your Gemini API key to `.env`:
```
GEMINI_API_KEY=your_actual_api_key_here
PORT=3001
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3001`

## API Endpoints

### POST /api/investment-analysis

Analyzes two companies and provides an investment recommendation.

**Request Body:**
```json
{
  "companyA": { ... },
  "companyB": { ... },
  "comparisonData": { ... },
  "chartData": { ... }
}
```

**Response:**
```json
{
  "verdict": "Plain text investment analysis..."
}
```

