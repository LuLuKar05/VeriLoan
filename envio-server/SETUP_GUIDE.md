# DeFi Lending Indexer - Setup Complete

This Envio indexer tracks lending activities (borrows, repays, liquidations, supplies, and withdraws) across three major DeFi protocols on Ethereum mainnet:

## Protocols Tracked

1. **Aave V3** - Address: `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`
2. **Compound V3 (USDC)** - Address: `0xc3d688B66703497DAA19211EEdff47f25384cdc3`
3. **Spark Protocol** - Address: `0xC13e21B648A5Ee794902342038FF3aDAB66BE987`

## Configuration

- **Network**: Ethereum Mainnet (Chain ID: 1)
- **Start Block**: 17,000,000 (adjust lower if you need earlier history)
- **Address Format**: Lowercase (for better performance)

## Next Steps

### 1. Run Code Generation (Required before first run)

```bash
pnpm codegen
```

This generates TypeScript types from your schema.

### 2. Start the Indexer

```bash
pnpm dev
```

This will:
- Start indexing from block 17,000,000
- Create a local PostgreSQL database
- Start a GraphQL API at `http://localhost:8080`
- Password: `testing`

### 3. Query Your Data

Once running, visit `http://localhost:8080` to access the GraphQL Playground.

## Example Queries

### Get User's Complete Lending Profile

```graphql
query GetUserProfile {
  user(id: "YOUR_WALLET_ADDRESS_LOWERCASE") {
    id
    totalBorrowsUSD
    totalSuppliesUSD
    totalLiquidations
    
    # All loan positions
    loanPositions {
      protocol
      asset
      assetAddress
      borrowedAmount
      borrowedAmountUSD
      collateralAmount
      collateralAmountUSD
      loanToValue
      liquidationThreshold
      healthFactor
      isActive
      createdAt
      updatedAt
    }
    
    # All supply/collateral positions
    supplyPositions {
      protocol
      asset
      suppliedAmount
      suppliedAmountUSD
      isCollateral
      createdAt
    }
    
    # Liquidation history
    liquidations {
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
}
```

### Get All Borrow Events for a User

```graphql
query GetUserBorrows {
  borrowEvents(
    where: { user: { _eq: "YOUR_WALLET_ADDRESS_LOWERCASE" } }
    orderBy: { timestamp: desc }
  ) {
    protocol
    asset
    amount
    amountUSD
    borrowRate
    timestamp
    blockNumber
    transactionHash
  }
}
```

### Get All Liquidations Across Protocols

```graphql
query GetAllLiquidations {
  liquidationEvents(
    orderBy: { timestamp: desc }
    limit: 100
  ) {
    user {
      id
    }
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

### Get User's Loan-to-Value Ratios

```graphql
query GetUserLTV {
  loanPositions(
    where: { 
      user_id: { _eq: "YOUR_WALLET_ADDRESS_LOWERCASE" }
      isActive: { _eq: true }
    }
  ) {
    protocol
    asset
    borrowedAmountUSD
    collateralAmountUSD
    loanToValue
    liquidationThreshold
    healthFactor
  }
}
```

### Get Supply History

```graphql
query GetSupplyHistory {
  supplyEvents(
    where: { user: { _eq: "YOUR_WALLET_ADDRESS_LOWERCASE" } }
    orderBy: { timestamp: desc }
  ) {
    protocol
    asset
    amount
    amountUSD
    timestamp
    blockNumber
  }
}
```

## Important Notes

### 1. Wallet Address Format
- **Always use lowercase addresses** in queries
- Example: `0xabc123...` not `0xABC123...`

### 2. USD Values
- Current implementation uses placeholder USD calculations
- **For production**: Integrate with price oracles (Chainlink, Uniswap TWAP, etc.)
- Modify the `estimateUSD()` function in `EventHandlers.ts`

### 3. Health Factor Calculation
- Current health factors are set to default values
- **For production**: Calculate actual health factors using:
  - Collateral value × Liquidation threshold / Borrowed value
  - Requires real-time price feeds

### 4. LTV Calculation
- Loan-to-Value = Borrowed amount / Collateral amount
- **For production**: Implement real-time LTV calculations with price oracles

### 5. Start Block Optimization
- Starting from block 17,000,000 (May 2023)
- Adjust lower if you need historical data from earlier
- **Warning**: Lower start blocks = longer initial sync time

## Troubleshooting

### Sync is too slow
- Increase `start_block` in `config.yaml` to a more recent block
- Ensure Docker is running with sufficient resources

### Missing events
- Check that wallet addresses are lowercase
- Verify the address actually interacted with these protocols
- Check block range includes the transaction period

### Database errors
- Restart Docker: `docker-compose down` then `pnpm dev`
- Clear generated files: `rm -rf generated/` then `pnpm codegen`

## Production Enhancements

Before deploying to production, consider:

1. **Price Oracles**: Integrate Chainlink or other oracle services for accurate USD values
2. **Token Resolution**: Add token symbol resolution (ERC20 name/symbol lookups)
3. **Health Factor**: Implement real-time health factor calculations
4. **Historical Prices**: Store historical price data for accurate reporting
5. **Notifications**: Add webhook support for liquidation alerts
6. **Rate Limiting**: Handle RPC rate limits with retries
7. **Error Handling**: Add comprehensive error logging and recovery
8. **Testing**: Add unit and integration tests
9. **Monitoring**: Set up monitoring and alerting

## File Structure

```
envio/
├── config.yaml              # Indexer configuration
├── schema.graphql          # Data model
├── abis/                   # Contract ABIs
│   ├── aave-v3-pool-abi.json
│   ├── compound-v3-comet-abi.json
│   └── spark-pool-abi.json
├── src/
│   └── EventHandlers.ts    # Event processing logic
└── generated/              # Auto-generated types (do not edit)
```

## Support

- [Envio Documentation](https://docs.envio.dev)
- [Envio Discord](https://discord.gg/envio)
- [GitHub Issues](https://github.com/enviodev/hyperindex)
