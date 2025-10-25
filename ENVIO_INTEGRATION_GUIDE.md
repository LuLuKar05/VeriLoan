# Envio Integration Guide for VeriLoan

## Overview

This integration connects VeriLoan's backend with the Envio indexer to fetch real-time DeFi lending data (loans, repayments, liquidations, and LTV ratios) based on EVM addresses stored in the MongoDB database.

## Architecture

```
┌──────────────┐         ┌─────────────┐         ┌──────────────┐
│   Frontend   │────────▶│   Backend   │────────▶│   MongoDB    │
└──────────────┘         └─────────────┘         └──────────────┘
                                │
                                │ GraphQL
                                ▼
                         ┌─────────────┐
                         │    Envio    │
                         │   Indexer   │
                         └─────────────┘
                                │
                                ▼
                         ┌─────────────┐
                         │  Blockchain │
                         │   (Aave V3, │
                         │ Compound V3,│
                         │   Spark)    │
                         └─────────────┘
```

## Features

### 1. **Loan Amount Tracking**
- Fetches all loan positions for an EVM address
- Shows borrowed amounts in USD
- Tracks loan status (active/repaid)
- Shows collateral amounts and ratios

### 2. **Repay Amount Tracking**
- Complete repayment history
- Total repaid amounts in USD
- Transaction timestamps and hashes
- Protocol-specific breakdowns

### 3. **Liquidation History**
- All liquidation events for a user
- Collateral seized amounts
- Debt covered
- Liquidator addresses

### 4. **Loan-to-Value (LTV) Ratios**
- Current LTV for active loans
- Average LTV across all positions
- Health factor tracking
- Risk assessment

## API Endpoints

### Base URL: `http://localhost:3001/api/envio`

### 1. Get User Loans
```http
GET /api/envio/loans/:evmAddress
```

**Example:**
```bash
curl http://localhost:3001/api/envio/loans/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Response:**
```json
{
  "success": true,
  "evmAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
  "totalLoans": 3,
  "activeLoans": 2,
  "loans": [
    {
      "id": "0x742d35cc...-aave_v3-usdc",
      "protocol": "AAVE_V3",
      "asset": "USDC",
      "borrowedAmount": "5000000000",
      "borrowedAmountUSD": "5000000000",
      "collateralAmount": "2000000000000000000",
      "collateralAmountUSD": "4000000000",
      "collateralAsset": "ETH",
      "loanToValue": "7500",
      "healthFactor": "1250000000000000000",
      "isActive": true,
      "createdAt": "1698765432",
      "transactionHash": "0xabc..."
    }
  ]
}
```

### 2. Get Repayment History
```http
GET /api/envio/repayments/:evmAddress
```

**Example:**
```bash
curl http://localhost:3001/api/envio/repayments/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Response:**
```json
{
  "success": true,
  "evmAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
  "totalRepayments": 5,
  "totalRepaidUSD": "12000000000",
  "repayments": [
    {
      "id": "1-12345-10",
      "user": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
      "protocol": "AAVE_V3",
      "asset": "USDC",
      "amount": "1000000000",
      "amountUSD": "1000000000",
      "timestamp": "1698765432",
      "transactionHash": "0xdef..."
    }
  ]
}
```

### 3. Get Liquidation History
```http
GET /api/envio/liquidations/:evmAddress
```

**Example:**
```bash
curl http://localhost:3001/api/envio/liquidations/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Response:**
```json
{
  "success": true,
  "evmAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
  "totalLiquidations": 1,
  "totalLiquidatedUSD": "500000000",
  "liquidations": [
    {
      "id": "1-12345-15",
      "user": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
      "liquidator": "0xabc...",
      "protocol": "COMPOUND_V3",
      "collateralAsset": "ETH",
      "debtAsset": "USDC",
      "debtToCover": "100000000",
      "liquidatedCollateralAmount": "50000000000000000",
      "liquidatedCollateralUSD": "100000000",
      "timestamp": "1698765432",
      "transactionHash": "0xghi..."
    }
  ]
}
```

### 4. Get Comprehensive Summary
```http
GET /api/envio/summary/:evmAddress
```

**This is the main endpoint** - combines all data (loans, repayments, liquidations, LTV)

**Example:**
```bash
curl http://localhost:3001/api/envio/summary/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "evmAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
    "totalLoans": 3,
    "activeLoans": 2,
    "totalBorrowedUSD": "8000000000",
    "totalRepaidUSD": "3000000000",
    "averageLTV": 72.5,
    "healthFactor": "1.25",
    "loans": [...],
    "repayments": [...],
    "liquidations": [...]
  }
}
```

### 5. Get Data for All Paired Wallets
```http
GET /api/envio/paired-wallet/:concordiumAddress
```

**This endpoint fetches loan data for ALL EVM addresses paired with a Concordium wallet**

**Example:**
```bash
curl http://localhost:3001/api/envio/paired-wallet/4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd
```

**Response:**
```json
{
  "success": true,
  "concordiumAddress": "4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd",
  "pairedWallets": 2,
  "aggregated": {
    "totalBorrowedUSD": "15000000000",
    "totalRepaidUSD": "5000000000",
    "totalActiveLoans": 4,
    "totalLiquidations": 2
  },
  "walletsData": [
    {
      "evmAddress": "0x742d35cc...",
      "success": true,
      "data": {
        "totalLoans": 3,
        "activeLoans": 2,
        "totalBorrowedUSD": "8000000000",
        ...
      }
    },
    {
      "evmAddress": "0xabc123...",
      "success": true,
      "data": {
        "totalLoans": 2,
        "activeLoans": 2,
        "totalBorrowedUSD": "7000000000",
        ...
      }
    }
  ]
}
```

### 6. Health Check
```http
GET /api/envio/health
```

Check if Envio indexer is reachable.

## Setup Instructions

### Step 1: Ensure Envio Indexer is Running

```bash
cd envio-server

# Install dependencies
npm install

# Start the indexer
npm run dev
```

The indexer should start on `http://localhost:8080`

### Step 2: Configure Backend

The backend `.env` file should have:

```env
ENVIO_GRAPHQL_ENDPOINT=http://localhost:8080/v1/graphql
```

### Step 3: Start Backend

```bash
cd backend
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
VeriLoan Backend Server
Listening on http://localhost:3001

Envio Integration Endpoints:
  GET  /api/envio/health
  GET  /api/envio/loans/:evmAddress
  GET  /api/envio/repayments/:evmAddress
  GET  /api/envio/liquidations/:evmAddress
  GET  /api/envio/summary/:evmAddress
  GET  /api/envio/paired-wallet/:concordiumAddress
```

### Step 4: Test the Integration

```bash
# Test health check
curl http://localhost:3001/api/envio/health

# Test with a real address (replace with actual address)
curl http://localhost:3001/api/envio/summary/0xYOUR_ADDRESS
```

## Usage Examples

### Example 1: Get Loan Data for Verified User

After a user completes identity verification:

```typescript
// Frontend code
const response = await fetch(`/api/envio/summary/${evmAddress}`);
const data = await response.json();

console.log('Total Borrowed:', data.summary.totalBorrowedUSD);
console.log('Average LTV:', data.summary.averageLTV);
console.log('Health Factor:', data.summary.healthFactor);
```

### Example 2: Display All Loans for Concordium User

```typescript
// Get all paired EVM wallets and their loan data
const response = await fetch(`/api/envio/paired-wallet/${concordiumAddress}`);
const data = await response.json();

console.log('Total Active Loans:', data.aggregated.totalActiveLoans);
console.log('Total Borrowed:', data.aggregated.totalBorrowedUSD);

// Display each wallet's data
data.walletsData.forEach(wallet => {
  if (wallet.success) {
    console.log(`Wallet ${wallet.evmAddress}:`, wallet.data);
  }
});
```

### Example 3: Check Liquidation Risk

```typescript
const response = await fetch(`/api/envio/loans/${evmAddress}`);
const data = await response.json();

// Filter high-risk loans (LTV > 80%)
const highRiskLoans = data.loans.filter(loan => 
  loan.isActive && parseInt(loan.loanToValue) > 8000
);

if (highRiskLoans.length > 0) {
  console.warn('⚠️ High-risk loans detected!');
  highRiskLoans.forEach(loan => {
    console.log(`- ${loan.asset}: LTV ${parseInt(loan.loanToValue) / 100}%`);
  });
}
```

## Data Flow

1. **User Verification** → EVM address stored in MongoDB (paired with Concordium wallet)
2. **Loan Query** → Backend fetches data from Envio via GraphQL
3. **Envio Response** → Real-time DeFi lending data from blockchain
4. **Frontend Display** → Show loans, repayments, liquidations, LTV

## Understanding the Data

### Loan Amounts
- **borrowedAmount**: Raw token amount (e.g., 5000000000 = 5000 USDC with 6 decimals)
- **borrowedAmountUSD**: USD value (same scaling)

### LTV (Loan-to-Value)
- Scaled by 10000
- Example: `7500` = 75%
- Calculate: `loanToValue / 10000 * 100`

### Health Factor
- Scaled by 1e18
- Example: `1250000000000000000` = 1.25
- Calculate: `healthFactor / 1e18`
- **< 1.0 = At risk of liquidation**

## Protocols Supported

- **Aave V3** (Ethereum Mainnet)
- **Compound V3** (Ethereum Mainnet)
- **Spark Protocol** (Ethereum Mainnet)

## Troubleshooting

### Issue: "Failed to fetch data from Envio"

**Solution:**
1. Check if Envio indexer is running:
   ```bash
   curl http://localhost:8080/v1/graphql
   ```
2. Verify `ENVIO_GRAPHQL_ENDPOINT` in `.env`
3. Check Envio logs for errors

### Issue: "No data returned for address"

**Possible reasons:**
1. Address has no DeFi activity on tracked protocols
2. Envio hasn't indexed recent blocks yet
3. Address format issue (should be lowercase)

### Issue: GraphQL errors

**Solution:**
- Check Envio server logs
- Verify GraphQL schema matches queries
- Ensure indexer is fully synced

## Production Deployment

### Envio Hosted Service

For production, use Envio's hosted indexer:

1. Deploy your indexer to Envio Cloud
2. Get your hosted GraphQL endpoint
3. Update `.env`:
   ```env
   ENVIO_GRAPHQL_ENDPOINT=https://indexer.envio.dev/YOUR_PROJECT/v1/graphql
   ```

### Rate Limiting

Implement rate limiting for production:

```typescript
// In backend
import rateLimit from 'express-rate-limit';

const envioLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30 // 30 requests per minute
});

app.use('/api/envio', envioLimiter, envioRoutes);
```

## Next Steps

1. ✅ Test endpoints with real addresses
2. ✅ Integrate into frontend UI
3. ✅ Add caching for frequently requested data
4. ✅ Implement WebSocket subscriptions for real-time updates
5. ✅ Add more DeFi protocols (Maker, Curve, etc.)

## Support

- Envio Documentation: https://docs.envio.dev
- VeriLoan Issues: [GitHub Issues]
- Contact: [Your email]
