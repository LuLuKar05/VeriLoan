# Report Component Usage Guide

## Overview

The Report Component generates a comprehensive user report that includes:
- ✅ User's name (first name, last name)
- ✅ Age verification (18+ or not)
- ✅ Country (nationality)
- ✅ Loan positions (active/inactive) from Hasura GraphQL
- ✅ Repayment history from Hasura GraphQL
- ✅ Liquidation events from Hasura GraphQL
- ✅ LTV ratios & health factors from Hasura GraphQL

**Backend logging:** All queries to Hasura GraphQL are logged in the backend server console with detailed information.

**Fallback behavior:** If an address is not found in GraphQL, all DeFi metrics will be filled with zeros (0).

---

## Backend API Endpoint

### POST `/api/report/:concordiumAddress`

Generates a report for the specified Concordium address.

**Request:**
```bash
POST http://localhost:8000/api/report/4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "generatedAt": "2025-10-26T10:30:00.000Z",
  "concordiumAddress": "4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd",
  "userIdentity": {
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "nationality": "US",
    "ageVerified18Plus": true,
    "verificationDate": "2025-10-20T08:15:00.000Z"
  },
  "pairedWallets": {
    "count": 2,
    "addresses": [
      "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
      "0x123456789abcdef..."
    ]
  },
  "defiData": {
    "loans": {
      "total": 5,
      "active": 2,
      "inactive": 3,
      "totalBorrowedUSD": "50000",
      "positions": [...]
    },
    "repayments": {
      "total": 3,
      "totalRepaidUSD": "15000",
      "history": [...]
    },
    "liquidations": {
      "total": 1,
      "totalLiquidatedUSD": "5000",
      "events": [...]
    },
    "metrics": {
      "currentDebtUSD": "35000",
      "ltvRatio": "Calculated per loan",
      "healthFactor": "At Risk"
    }
  },
  "dataSources": {
    "identity": "MongoDB (verified via Concordium ZKP)",
    "defiData": "Hasura GraphQL API (PostgreSQL)",
    "hasuraEndpoint": "http://localhost:8080/v1/graphql"
  }
}
```

---

## Frontend Integration

### Option 1: Add to Existing Component

Add the Report button to your existing verification component (e.g., `App.tsx`):

```tsx
import React, { useState } from 'react';
import ReportComponent from './ReportComponent';

function App() {
  const [showReport, setShowReport] = useState(false);
  const [concordiumAddress, setConcordiumAddress] = useState<string>('');

  // ... your existing verification logic ...

  return (
    <div>
      {/* Your existing verification UI */}
      
      {/* After successful verification, show report button */}
      {verificationComplete && concordiumAddress && (
        <>
          <button onClick={() => setShowReport(true)}>
            📊 Generate Report
          </button>
          
          {showReport && (
            <ReportComponent 
              concordiumAddress={concordiumAddress}
              backendUrl="http://localhost:8000"
            />
          )}
        </>
      )}
    </div>
  );
}
```

### Option 2: Standalone Report Page

Create a dedicated report page:

```tsx
// src/pages/ReportPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import ReportComponent from '../ReportComponent';

export function ReportPage() {
  const { address } = useParams<{ address: string }>();

  return (
    <div>
      <h1>User Report</h1>
      {address ? (
        <ReportComponent concordiumAddress={address} />
      ) : (
        <p>No address provided</p>
      )}
    </div>
  );
}
```

---

## Backend Logging Output

When you click "Generate Report", the backend will log detailed information:

```
═══════════════════════════════════════════════════════════
📊 REPORT GENERATION REQUEST
═══════════════════════════════════════════════════════════
Concordium Address: 4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd
Timestamp: 2025-10-26T10:30:00.000Z

🔍 Step 1: Fetching user identity from MongoDB...
✅ User identity found:
   - First Name: John
   - Last Name: Doe
   - Nationality: US
   - Age Verified (18+): YES
   - Paired EVM Addresses: 2
     1. 0x742d35cc6634c0532925a3b844bc9e7595f0beb
     2. 0x123456789abcdef...

🔍 Step 2: Querying Hasura GraphQL for DeFi lending data...
   Hasura Endpoint: http://localhost:8080/v1/graphql

   📍 Querying for EVM address: 0x742d35cc6634c0532925a3b844bc9e7595f0beb
      - Fetching loans from GraphQL...
      ✅ Found 3 loan records
         1. Protocol: Aave V3, Asset: USDC, Amount: $10000, Active: true
         2. Protocol: Compound V3, Asset: DAI, Amount: $25000, Active: true
         3. Protocol: Spark, Asset: WETH, Amount: $15000, Active: false
      - Fetching repayments from GraphQL...
      ✅ Found 2 repayment records
         1. Protocol: Aave V3, Asset: USDC, Amount: $5000
         2. Protocol: Compound V3, Asset: DAI, Amount: $10000
      - Fetching liquidations from GraphQL...
      ✅ Found 1 liquidation records
         1. Protocol: Spark, Collateral: WETH, Debt: DAI, Liquidated: $5000

   📍 Querying for EVM address: 0x123456789abcdef...
      - Fetching loans from GraphQL...
      ⚠️  Found 0 loan records
      - Fetching repayments from GraphQL...
      ⚠️  Found 0 repayment records
      - Fetching liquidations from GraphQL...
      ⚠️  Found 0 liquidation records

📊 AGGREGATED DEFI DATA SUMMARY:
   - Total Loans Found: 3
   - Active Loans: 2
   - Total Borrowed (USD): 50000
   - Total Repayments: 2
   - Total Repaid (USD): 15000
   - Total Liquidations: 1
   - Total Liquidated (USD): 5000
   - Current Debt (USD): 35000
   - Health Status: At Risk

✅ REPORT GENERATION COMPLETED
═══════════════════════════════════════════════════════════
```

---

## Error Handling

### If User Not Found (404)
```json
{
  "success": false,
  "error": "No wallet pairing found for this Concordium address",
  "message": "User must complete identity verification first"
}
```

Backend logs:
```
❌ No wallet pairing found for this Concordium address
```

### If Hasura Query Fails
The backend will continue with zero values:
```
⚠️  Error querying Hasura for 0x742d35cc6634c0532925a3b844bc9e7595f0beb: Connection refused
→ Continuing with zero values for this address
```

All DeFi metrics will be `0`:
- Total Loans: 0
- Active Loans: 0
- Total Borrowed: $0
- Total Repayments: 0
- Total Liquidations: 0

---

## Testing

### 1. Test with cURL:
```bash
# Generate report
curl -X POST http://localhost:8000/api/report/4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd

# Check backend logs
# You should see detailed GraphQL query logs
```

### 2. Test in Frontend:
```tsx
// In your component
<ReportComponent 
  concordiumAddress="4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd"
  backendUrl="http://localhost:8000"
/>
```

### 3. Check Backend Console:
Look for the detailed logging output showing:
- ✅ User identity retrieval
- ✅ Hasura GraphQL queries
- ✅ Individual loan/repayment/liquidation records
- ✅ Aggregated summary

---

## Features

✅ **User Identity Display**
- First name, last name, full name
- Age verification (18+ YES/NO)
- Country/nationality

✅ **DeFi Data from Hasura**
- Loan positions (active/inactive counts)
- Total borrowed amounts in USD
- Repayment history with totals
- Liquidation events with totals
- LTV ratios and health factors

✅ **Backend Logging**
- Every GraphQL query is logged
- Individual records are displayed
- Aggregated summaries shown
- Errors are logged with context

✅ **Fallback to Zeros**
- If address not found in Hasura → all metrics = 0
- No errors thrown, graceful degradation
- Clear warnings in logs

✅ **Download Report**
- Text file format
- Includes all user data
- Timestamped filename

---

## Environment Variables

Make sure your `.env` has:
```bash
# Hasura Configuration
HASURA_ENDPOINT=http://localhost:8080/v1/graphql
HASURA_ADMIN_SECRET=your-admin-secret

# Backend Port
PORT=8000

# MongoDB
MONGODB_URI=mongodb://localhost:27017
DB_NAME=veriloan
```

---

## Next Steps

1. **Start Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Hasura:**
   ```bash
   # Hasura should be running on port 8080
   ```

3. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Test Report Generation:**
   - Complete identity verification first
   - Click "Generate Report" button
   - Check backend console for detailed logs
   - View report in frontend
   - Download report as text file

---

## Summary

Your report system now:
- ✅ Fetches user identity from MongoDB (name, age, country)
- ✅ Queries Hasura GraphQL for DeFi data (loans, repayments, liquidations, LTV)
- ✅ Logs all queries in backend console with detailed information
- ✅ Falls back to zeros if address not found in GraphQL
- ✅ Displays comprehensive report in frontend
- ✅ Allows downloading report as text file

🎉 All requirements implemented!
