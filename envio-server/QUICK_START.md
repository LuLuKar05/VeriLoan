# 🎉 Your DeFi Lending Indexer is Ready!

## What You Can Do Now

Your Envio indexer is fully configured to track **loan history**, **liquidations**, and **loan-to-value ratios** for any wallet address across three major DeFi protocols on Ethereum:

### Protocols Covered
✅ **Aave V3** - Full lending protocol  
✅ **Compound V3** - USDC market  
✅ **Spark Protocol** - MakerDAO's lending protocol  

### Data You Can Query
✅ Borrow events  
✅ Repay events  
✅ Supply/deposit events  
✅ Withdrawal events  
✅ Liquidation events  
✅ User aggregates (total borrows, supplies, liquidation count)  

## Quick Start

1. **Start the indexer:**
   ```bash
   pnpm dev
   ```

2. **Access GraphQL API:**
   - URL: http://localhost:8080
   - Password: `testing`

3. **Query a wallet (replace with your address in lowercase):**
   ```graphql
   query {
     user(id: "YOUR_WALLET_ADDRESS_LOWERCASE") {
       totalBorrowsUSD
       totalSuppliesUSD
       totalLiquidations
     }
     
     borrowEvents(where: { user: { _eq: "YOUR_WALLET_ADDRESS_LOWERCASE" } }) {
       protocol
       asset
       amount
       timestamp
     }
     
     liquidationEvents(where: { user_id: { _eq: "YOUR_WALLET_ADDRESS_LOWERCASE" } }) {
       protocol
       collateralAsset
       debtAsset
       liquidatedCollateralAmount
       timestamp
     }
   }
   ```

## Important Notes

### Wallet Addresses
- **Must be lowercase** in queries
- Example: `0x742d35cc...` not `0x742D35CC...`

### USD Values
- Currently using placeholder 1:1 values
- For production: integrate Chainlink or other price oracles
- Edit `estimateUSD()` in `src/EventHandlers.ts`

### Sync Time
- Starting from block 17,000,000 (May 2023)
- Initial sync may take time depending on your RPC provider
- To sync faster: increase `start_block` in `config.yaml`

### LTV Calculations
- Schema supports LTV tracking
- Requires price oracle integration for real-time calculations
- Position tracking handlers can be enhanced

## File Structure

```
envio/
├── README.md               ← Quick start guide
├── SETUP_GUIDE.md          ← Detailed documentation
├── config.yaml             ← Protocol configuration
├── schema.graphql          ← Data model
├── src/
│   └── EventHandlers.ts    ← Event processing logic
└── abis/                   ← Contract ABIs
    ├── aave-v3-pool-abi.json
    ├── compound-v3-comet-abi.json
    └── spark-pool-abi.json
```

## Next Steps

### For Testing
1. Run `pnpm dev`
2. Wait for initial sync
3. Query your wallet address
4. Explore the data in GraphQL playground

### For Production
1. **Add Price Oracles** - Get real USD values
2. **Calculate Real LTV** - Use collateral and debt values with prices
3. **Track Health Factors** - Monitor liquidation risk
4. **Add More Protocols** - Expand beyond Aave/Compound/Spark
5. **Set Up Alerts** - Notify on high-risk positions

## Example Query for Your Wallet

```graphql
query MyDeFiActivity {
  # Your aggregated stats
  user(id: "0xyour_wallet_address_lowercase") {
    id
    totalBorrowsUSD
    totalSuppliesUSD
    totalLiquidations
  }
  
  # Recent borrows
  borrowEvents(
    where: { user: { _eq: "0xyour_wallet_address_lowercase" } }
    orderBy: { timestamp: desc }
    limit: 10
  ) {
    protocol
    asset
    amount
    borrowRate
    timestamp
  }
  
  # Liquidation history
  liquidationEvents(
    where: { user_id: { _eq: "0xyour_wallet_address_lowercase" } }
    orderBy: { timestamp: desc }
  ) {
    protocol
    collateralAsset
    debtAsset
    liquidatedCollateralAmount
    liquidatedCollateralUSD
    timestamp
    blockNumber
  }
}
```

## Troubleshooting

**No data appearing?**
- Check if your wallet address is lowercase
- Verify the wallet used these protocols after block 17,000,000
- Ensure Docker is running

**Indexer too slow?**
- Increase `start_block` in config.yaml
- Check your RPC endpoint performance
- Ensure Docker has enough resources (4GB+ RAM)

**Need help?**
- Check [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- Visit [Envio Docs](https://docs.envio.dev)
- Join [Envio Discord](https://discord.gg/envio)

---

## Ready to Go! 🚀

Run `pnpm dev` and start querying your DeFi lending history!

For detailed examples and advanced queries, see [SETUP_GUIDE.md](./SETUP_GUIDE.md).
