# Investment Analysis Feature Setup Guide

## Overview

The "Analysis for Investments" feature uses Google Gemini AI to provide investment recommendations by comparing two companies based on their financial data.

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Add your Gemini API key to `.env`:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3001
```

5. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:3001`

## Frontend Setup

The frontend is already configured. The Vite dev server proxies `/api` requests to the backend.

1. Start the frontend (if not already running):
```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:8081`

## Usage

1. Navigate to the Compare page (`/compare`)
2. Search and select two companies
3. Click "Show data" to view the comparison
4. Click "Analysis for Investments" button
5. Wait for the AI analysis (loading indicator will show)
6. View the investment verdict in the card below

## API Endpoint

### POST /api/investment-analysis

**Request Body:**
```json
{
  "companyA": { ...full company record... },
  "companyB": { ...full company record... },
  "comparisonData": {
    "metrics": [...]
  },
  "chartData": {
    "salesProfitTrends": [...],
    "profitabilityComparison": [...],
    "valuationRatios": [...]
  }
}
```

**Response:**
```json
{
  "verdict": "Plain text investment analysis..."
}
```

## Environment Variables

### Backend (.env)
- `GEMINI_API_KEY`: Your Google Gemini API key (required)
- `PORT`: Backend server port (default: 3001)

### Frontend
- `VITE_API_BASE_URL`: Backend API URL (default: http://localhost:3001)

## Troubleshooting

1. **Backend not starting**: Check that `GEMINI_API_KEY` is set in `.env`
2. **API errors**: Verify backend is running on port 3001
3. **CORS errors**: Backend has CORS enabled for all origins
4. **Analysis fails**: Check backend logs for Gemini API errors

