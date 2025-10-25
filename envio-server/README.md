# DeFi Lending Indexer - Quick Start

## ✅ Setup Complete!

Your Envio indexer is now configured to track lending activities on Ethereum mainnet across:
- **Aave V3**
- **Compound V3 (USDC market)**
- **Spark Protocol**

## 🚀 Getting Started

### 1. Start the Indexer

```bash
pnpm dev
```

This will:
- Start indexing from block 17,000,000 on Ethereum
- Launch a local PostgreSQL database
- Start a GraphQL API at **http://localhost:8080**
- Default password: `testing`

### 2. Query for a Specific Wallet

Once running, visit `http://localhost:8080` and use these queries:

#### Get Complete User Profile

Replace `YOUR_WALLET_ADDRESS` with the wallet address in **lowercase**:

```graphql
query GetWalletProfile {
  user(id: "0x742d35cc6634c0532925a3b844bc9e7595f0beb") {
    id
    totalBorrowsUSD
    totalSuppliesUSD
    totalLiquidations
  }
}
```

#### Get All Borrow Events for a Wallet

```graphql
query GetUserBorrows {
  borrowEvents(
    where: { user: { _eq: "0x742d35cc6634c0532925a3b844bc9e7595f0beb" } }
    orderBy: { timestamp: desc }
    limit: 50
  ) {
    protocol
    asset
    amount
    amountUSD
    borrowRate
    timestamp
    blockNumber
  }
}
```

#### Get Liquidation History

```graphql
query GetUserLiquidations {
  liquidationEvents(
    where: { user_id: { _eq: "0x742d35cc6634c0532925a3b844bc9e7595f0beb" } }
    orderBy: { timestamp: desc }
  ) {
    protocol
    collateralAsset
    debtAsset
    debtToCover
    liquidatedCollateralAmount
    liquidatedCollateralUSD
    liquidator
    timestamp
    blockNumber
  }
}
```

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for more query examples and detailed documentation.

## 📚 Resources

- [Envio Documentation](https://docs.envio.dev)
- [Full Setup Guide](./SETUP_GUIDE.md)

