# VeriLoan Envio Integration - Quick Start

## What Was Added

✅ **Envio GraphQL Client** (`backend/src/envio-client.ts`)
- Connects to Envio indexer via GraphQL
- Fetches loan data, repayments, liquidations, LTV ratios

✅ **API Routes** (`backend/src/routes/envio-routes.ts`)
- 6 new endpoints to access DeFi lending data
- Integration with MongoDB wallet pairings

✅ **Backend Integration** (`backend/src/index.ts`)
- Mounted Envio routes at `/api/envio/*`
- Added health check and logging

✅ **Configuration** (`backend/.env`)
- Added `ENVIO_GRAPHQL_ENDPOINT` setting

✅ **Documentation** (`ENVIO_INTEGRATION_GUIDE.md`)
- Complete API reference
- Usage examples
- Troubleshooting guide

## Quick Test (5 Minutes)

### 1. Start Envio Indexer

```powershell
cd envio-server
npm install  # If not already done
npm run dev
```

**Expected output:**
```
✓ Starting Envio Indexer
✓ Connected to Ethereum Mainnet
✓ GraphQL server running on http://localhost:8080
```

### 2. Start Backend

```powershell
cd backend
npm run dev
```

**Expected output:**
```
🔄 Initializing MongoDB connection...
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

### 3. Test the Integration

```powershell
# Test health check
curl http://localhost:3001/api/envio/health

# Should return:
# {
#   "success": true,
#   "envioStatus": "healthy",
#   "timestamp": "2025-10-25T..."
# }
```

### 4. Test with Real Address

Replace `0xYOUR_ADDRESS` with an actual Ethereum address that has DeFi activity:

```powershell
curl http://localhost:3001/api/envio/summary/0xYOUR_ADDRESS
```

**Example with a known DeFi user:**
```powershell
curl http://localhost:3001/api/envio/summary/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

## The 4 Key Data Points You Requested

### 1. **Loan Amount** ✅
```powershell
curl http://localhost:3001/api/envio/loans/0xADDRESS
```

Returns: `borrowedAmount`, `borrowedAmountUSD` for each loan

### 2. **Repay Amount** ✅
```powershell
curl http://localhost:3001/api/envio/repayments/0xADDRESS
```

Returns: `totalRepaidUSD`, list of all repayment events

### 3. **Liquidation History** ✅
```powershell
curl http://localhost:3001/api/envio/liquidations/0xADDRESS
```

Returns: All liquidation events with amounts and timestamps

### 4. **Loan-to-Value (LTV)** ✅
```powershell
curl http://localhost:3001/api/envio/summary/0xADDRESS
```

Returns: `averageLTV`, `loanToValue` per loan, `healthFactor`

## Integration with Your Existing System

### Get Data for Paired Wallets

Since you store EVM addresses paired with Concordium wallets, use this endpoint:

```powershell
curl http://localhost:3001/api/envio/paired-wallet/YOUR_CONCORDIUM_ADDRESS
```

This will:
1. Look up all EVM addresses paired with the Concordium wallet (from MongoDB)
2. Fetch loan data for ALL paired EVM addresses
3. Return aggregated statistics

**Example Response:**
```json
{
  "success": true,
  "concordiumAddress": "4UC8o4m8AgTxt...",
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
        "totalRepaidUSD": "3000000000",
        "averageLTV": 72.5,
        "healthFactor": "1.25",
        "loans": [...],
        "repayments": [...],
        "liquidations": [...]
      }
    }
  ]
}
```

## Understanding the Numbers

### Amounts (USDC, DAI, etc.)
- Values are in smallest token units
- USDC (6 decimals): `5000000000` = $5,000 USD
- DAI (18 decimals): `5000000000000000000` = 5 DAI

### LTV (Loan-to-Value)
- Scaled by 10,000
- `7500` = 75%
- Formula: `LTV / 100` = actual percentage

### Health Factor
- Scaled by 1e18
- `1250000000000000000` = 1.25
- **< 1.0 = Risk of liquidation**
- Formula: `healthFactor / 1e18` = actual value

## Next Steps

### 1. Test with Your Verified Users

After a user completes identity verification and pairs their wallets:

```javascript
// Example: After verification
const concordiumAddress = verifiedUser.concordiumAddress;

// Get all their loan data
const response = await fetch(
  `/api/envio/paired-wallet/${concordiumAddress}`
);
const loanData = await response.json();

// Display in UI
console.log('Total Borrowed:', loanData.aggregated.totalBorrowedUSD);
console.log('Total Loans:', loanData.aggregated.totalActiveLoans);
```

### 2. Add to Frontend

Create a component to display loan information:

```tsx
// components/LoanDashboard.tsx
function LoanDashboard({ concordiumAddress }) {
  const [loanData, setLoanData] = useState(null);
  
  useEffect(() => {
    fetch(`/api/envio/paired-wallet/${concordiumAddress}`)
      .then(res => res.json())
      .then(data => setLoanData(data));
  }, [concordiumAddress]);
  
  if (!loanData) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>Your DeFi Loans</h2>
      <p>Total Borrowed: ${formatUSD(loanData.aggregated.totalBorrowedUSD)}</p>
      <p>Total Repaid: ${formatUSD(loanData.aggregated.totalRepaidUSD)}</p>
      <p>Active Loans: {loanData.aggregated.totalActiveLoans}</p>
      <p>Liquidations: {loanData.aggregated.totalLiquidations}</p>
    </div>
  );
}
```

### 3. Monitor Health Factors

Set up alerts for risky loans:

```typescript
// Check health factors periodically
async function checkLoanHealth(evmAddress: string) {
  const summary = await fetch(`/api/envio/summary/${evmAddress}`).then(r => r.json());
  
  const healthFactor = parseFloat(summary.summary.healthFactor);
  
  if (healthFactor < 1.1) {
    // Send alert - loan at risk of liquidation!
    sendAlert(evmAddress, healthFactor);
  }
}
```

## Troubleshooting

### "Envio is unhealthy"

1. Check if Envio indexer is running:
   ```powershell
   # In envio-server directory
   npm run dev
   ```

2. Verify endpoint in `.env`:
   ```
   ENVIO_GRAPHQL_ENDPOINT=http://localhost:8080/v1/graphql
   ```

3. Test GraphQL directly:
   ```powershell
   curl http://localhost:8080/v1/graphql
   ```

### "No data returned"

- The address might not have any DeFi activity on Aave V3, Compound V3, or Spark
- Try with a known DeFi user address
- Check if Envio has finished syncing blocks

### TypeScript Errors

```powershell
cd backend
npx tsc --noEmit  # Check for errors
```

## Files Created/Modified

### New Files:
- ✅ `backend/src/envio-client.ts` - GraphQL client
- ✅ `backend/src/routes/envio-routes.ts` - API endpoints
- ✅ `ENVIO_INTEGRATION_GUIDE.md` - Full documentation
- ✅ `ENVIO_QUICK_START.md` - This file

### Modified Files:
- ✅ `backend/src/index.ts` - Added Envio routes
- ✅ `backend/.env` - Added Envio endpoint config

## Summary

You now have a complete integration that:

✅ Fetches **loan amounts** from Aave V3, Compound V3, and Spark
✅ Tracks **repayment amounts** with full history
✅ Shows **liquidation history** with details
✅ Calculates **loan-to-value ratios** and health factors
✅ Works with your **MongoDB wallet pairings**
✅ Provides **aggregated data** for all paired wallets

**All 4 data points requested are now available via API!**

## Questions?

Read the full documentation: `ENVIO_INTEGRATION_GUIDE.md`

Need help? Check the troubleshooting section above.
