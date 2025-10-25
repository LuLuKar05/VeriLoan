# TypeScript Client Usage Guide

## Two Options Available

### Option 1: With graphql-request (Recommended)
File: `client-example.ts`

**Install dependencies:**
```bash
npm install graphql-request graphql
```

**Pros:**
- Cleaner syntax with `gql` template strings
- Better TypeScript support
- Auto-completion in most IDEs

---

### Option 2: Native Fetch (No Dependencies)
File: `client-native.ts`

**No installation needed!** Works out of the box with Node.js 18+ or any modern JavaScript runtime.

**Pros:**
- Zero dependencies
- Smaller bundle size
- Works everywhere

---

## Quick Start (Native Fetch - Simplest)

1. **Copy the client file:**
```bash
cp client-native.ts src/defi-client.ts
```

2. **Use in your code:**
```typescript
import { getUserProfile, getUserBorrows, getUserLiquidations } from './defi-client';

async function checkUserLending() {
  // Get user profile
  const user = await getUserProfile('0x742d35cc6634c0532925a3b844bc9e7595f0beb');
  console.log('Total Borrows:', user?.totalBorrowsUSD);
  
  // Get borrow history
  const borrows = await getUserBorrows('0x742d35cc6634c0532925a3b844bc9e7595f0beb', 10);
  console.log('Number of borrows:', borrows.length);
  
  // Get liquidations
  const liquidations = await getUserLiquidations('0x742d35cc6634c0532925a3b844bc9e7595f0beb');
  console.log('Times liquidated:', liquidations.length);
}

checkUserLending();
```

3. **Run it:**
```bash
npx ts-node your-file.ts
```

---

## Available Functions

### User Queries

```typescript
// Get user profile with aggregate stats
getUserProfile(walletAddress: string): Promise<User | null>

// Get user's borrow history
getUserBorrows(walletAddress: string, limit?: number): Promise<BorrowEvent[]>

// Get user's supply/deposit history
getUserSupplies(walletAddress: string, limit?: number): Promise<SupplyEvent[]>

// Get user's liquidation history
getUserLiquidations(walletAddress: string): Promise<LiquidationEvent[]>

// Get ALL user activity in one call
getUserCompleteHistory(walletAddress: string): Promise<CompleteHistory>
```

### Global Queries

```typescript
// Get recent liquidations across all users
getRecentLiquidations(limit?: number): Promise<LiquidationEvent[]>

// Get protocol statistics
getProtocolStats(): Promise<Stats>

// Get users with most liquidations
getTopLiquidatedUsers(limit?: number): Promise<User[]>

// Find high-value liquidations
getHighValueLiquidations(minValueUSD: string, limit?: number): Promise<LiquidationEvent[]>
```

---

## Real-World Examples

### Example 1: Build a Liquidation Alert System

```typescript
import { getRecentLiquidations } from './client-native';

async function monitorLiquidations() {
  setInterval(async () => {
    const liquidations = await getRecentLiquidations(10);
    
    for (const liq of liquidations) {
      // Check if it's a large liquidation
      const valueUSD = BigInt(liq.liquidatedCollateralUSD);
      if (valueUSD > BigInt('1000000000000000000000')) { // > $1000
        console.log('🚨 Large liquidation detected!');
        console.log('User:', liq.user_id);
        console.log('Protocol:', liq.protocol);
        console.log('Value:', liq.liquidatedCollateralUSD);
        // Send alert (email, Discord, etc.)
      }
    }
  }, 60000); // Check every minute
}

monitorLiquidations();
```

### Example 2: Build a DeFi Portfolio Dashboard

```typescript
import { getUserCompleteHistory } from './client-native';

async function getDeFiPortfolio(walletAddress: string) {
  const history = await getUserCompleteHistory(walletAddress);
  
  return {
    summary: {
      totalBorrows: history.user?.totalBorrowsUSD || '0',
      totalSupplies: history.user?.totalSuppliesUSD || '0',
      timesLiquidated: history.user?.totalLiquidations || 0,
    },
    protocols: {
      aave: history.borrowEvents?.filter(e => e.protocol === 'AAVE_V3').length || 0,
      compound: history.borrowEvents?.filter(e => e.protocol === 'COMPOUND_V3').length || 0,
      spark: history.borrowEvents?.filter(e => e.protocol === 'SPARK').length || 0,
    },
    recentActivity: {
      borrows: history.borrowEvents?.slice(0, 5) || [],
      supplies: history.supplyEvents?.slice(0, 5) || [],
      liquidations: history.liquidationEvents || [],
    }
  };
}

// Usage
const portfolio = await getDeFiPortfolio('0x742d35cc6634c0532925a3b844bc9e7595f0beb');
console.log(JSON.stringify(portfolio, null, 2));
```

### Example 3: Risk Analysis

```typescript
import { getUserProfile, getUserLiquidations } from './client-native';

async function analyzeUserRisk(walletAddress: string) {
  const user = await getUserProfile(walletAddress);
  const liquidations = await getUserLiquidations(walletAddress);
  
  if (!user) {
    return { risk: 'UNKNOWN', reason: 'User not found' };
  }
  
  // Calculate risk score
  const totalBorrows = BigInt(user.totalBorrowsUSD);
  const totalSupplies = BigInt(user.totalSuppliesUSD);
  const numLiquidations = user.totalLiquidations;
  
  // High risk if:
  // - Been liquidated 3+ times
  // - Borrows > 80% of supplies
  if (numLiquidations >= 3) {
    return { risk: 'HIGH', reason: 'Multiple liquidations' };
  }
  
  if (totalSupplies > 0n) {
    const ltv = (totalBorrows * 100n) / totalSupplies;
    if (ltv > 80n) {
      return { risk: 'HIGH', reason: 'High LTV ratio' };
    } else if (ltv > 60n) {
      return { risk: 'MEDIUM', reason: 'Moderate LTV ratio' };
    }
  }
  
  return { risk: 'LOW', reason: 'Healthy position' };
}

// Usage
const risk = await analyzeUserRisk('0x742d35cc6634c0532925a3b844bc9e7595f0beb');
console.log('Risk Assessment:', risk);
```

### Example 4: Build an API Endpoint (Express)

```typescript
import express from 'express';
import { getUserProfile, getUserBorrows, getUserLiquidations } from './client-native';

const app = express();

app.get('/api/user/:address', async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    
    const [profile, borrows, liquidations] = await Promise.all([
      getUserProfile(address),
      getUserBorrows(address, 10),
      getUserLiquidations(address),
    ]);
    
    res.json({
      profile,
      recentBorrows: borrows,
      liquidations,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.listen(3000, () => {
  console.log('API running on http://localhost:3000');
});
```

---

## Important Notes

### 1. Always Use Lowercase Addresses
```typescript
// ✅ Good
const user = await getUserProfile('0x742d35cc6634c0532925a3b844bc9e7595f0beb');

// ❌ Bad
const user = await getUserProfile('0x742D35CC6634C0532925A3B844BC9E7595F0BEB');
```

### 2. Handle BigInt Values
USD values are returned as strings representing BigInt:
```typescript
const user = await getUserProfile(address);
const borrowsUSD = BigInt(user.totalBorrowsUSD);
// Convert to human-readable format
const borrowsInEther = Number(borrowsUSD) / 1e18;
```

### 3. Error Handling
```typescript
try {
  const user = await getUserProfile(address);
  if (!user) {
    console.log('User not found - no activity yet');
  }
} catch (error) {
  console.error('GraphQL Error:', error);
}
```

### 4. Change the Endpoint for Production
```typescript
const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'http://localhost:8080/v1/graphql';
```

---

## Testing the Client

Run the examples in the client file:
```bash
# For client-native.ts
npx ts-node client-native.ts
```

Or uncomment the example functions at the bottom of the file:
```typescript
// Uncomment these lines:
example1(); // Get user profile
example2(); // Get borrow history
example3(); // Get complete history
```

---

## Need Help?

- Check `TEST_QUERIES.md` for raw GraphQL queries
- See `SETUP_GUIDE.md` for more information
- GraphQL Playground: http://localhost:8080
