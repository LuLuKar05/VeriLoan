import {
  AaveV3Pool,
  CompoundV3Comet,
  SparkPool,
} from "generated";

// Helper functions
const getTxId = (event: any) => `${event.chainId}-${event.block.number}-${event.logIndex}`;
const estimateUSD = (amount: bigint) => amount;

async function ensureUser(context: any, userId: string) {
  let user = await context.User.get(userId);
  if (!user) {
    context.User.set({
      id: userId,
      totalBorrowsUSD: 0n,
      totalSuppliesUSD: 0n,
      totalLiquidations: 0,
    });
  }
}

// AAVE V3 Handlers
AaveV3Pool.Borrow.handler(async ({ event, context }) => {
  const userId = event.params.onBehalfOf.toLowerCase();
  await ensureUser(context, userId);

  context.BorrowEvent.set({
    id: getTxId(event),
    user: userId,
    protocol: "AAVE_V3",
    asset: event.params.reserve.toLowerCase(),
    assetAddress: event.params.reserve.toLowerCase(),
    amount: event.params.amount,
    amountUSD: estimateUSD(event.params.amount),
    borrowRate: event.params.borrowRate,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.block.hash,
  });
});

AaveV3Pool.Repay.handler(async ({ event, context }) => {
  context.RepayEvent.set({
    id: getTxId(event),
    user: event.params.user.toLowerCase(),
    protocol: "AAVE_V3",
    asset: event.params.reserve.toLowerCase(),
    assetAddress: event.params.reserve.toLowerCase(),
    amount: event.params.amount,
    amountUSD: estimateUSD(event.params.amount),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.block.hash,
  });
});

AaveV3Pool.Supply.handler(async ({ event, context }) => {
  const userId = event.params.onBehalfOf.toLowerCase();
  await ensureUser(context, userId);

  context.SupplyEvent.set({
    id: getTxId(event),
    user: userId,
    protocol: "AAVE_V3",
    asset: event.params.reserve.toLowerCase(),
    assetAddress: event.params.reserve.toLowerCase(),
    amount: event.params.amount,
    amountUSD: estimateUSD(event.params.amount),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.block.hash,
  });
});

AaveV3Pool.Withdraw.handler(async ({ event, context }) => {
  context.WithdrawEvent.set({
    id: getTxId(event),
    user: event.params.user.toLowerCase(),
    protocol: "AAVE_V3",
    asset: event.params.reserve.toLowerCase(),
    assetAddress: event.params.reserve.toLowerCase(),
    amount: event.params.amount,
    amountUSD: estimateUSD(event.params.amount),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.block.hash,
  });
});

AaveV3Pool.LiquidationCall.handler(async ({ event, context }) => {
  const userId = event.params.user.toLowerCase();
  await ensureUser(context, userId);

  context.LiquidationEvent.set({
    id: getTxId(event),
    user_id: userId,
    liquidator: event.params.liquidator.toLowerCase(),
    protocol: "AAVE_V3",
    collateralAsset: event.params.collateralAsset.toLowerCase(),
    collateralAssetAddress: event.params.collateralAsset.toLowerCase(),
    debtAsset: event.params.debtAsset.toLowerCase(),
    debtAssetAddress: event.params.debtAsset.toLowerCase(),
    debtToCover: event.params.debtToCover,
    liquidatedCollateralAmount: event.params.liquidatedCollateralAmount,
    liquidatedCollateralUSD: estimateUSD(event.params.liquidatedCollateralAmount),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.block.hash,
  });

  const user = await context.User.get(userId);
  if (user) {
    context.User.set({ ...user, totalLiquidations: user.totalLiquidations + 1 });
  }
});

// Spark Protocol Handlers (same events as Aave)
SparkPool.Borrow.handler(async ({ event, context }) => {
  const userId = event.params.onBehalfOf.toLowerCase();
  await ensureUser(context, userId);

  context.BorrowEvent.set({
    id: getTxId(event),
    user: userId,
    protocol: "SPARK",
    asset: event.params.reserve.toLowerCase(),
    assetAddress: event.params.reserve.toLowerCase(),
    amount: event.params.amount,
    amountUSD: estimateUSD(event.params.amount),
    borrowRate: event.params.borrowRate,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.block.hash,
  });
});

SparkPool.Repay.handler(async ({ event, context }) => {
  context.RepayEvent.set({
    id: getTxId(event),
    user: event.params.user.toLowerCase(),
    protocol: "SPARK",
    asset: event.params.reserve.toLowerCase(),
    assetAddress: event.params.reserve.toLowerCase(),
    amount: event.params.amount,
    amountUSD: estimateUSD(event.params.amount),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.block.hash,
  });
});

SparkPool.Supply.handler(async ({ event, context }) => {
  const userId = event.params.onBehalfOf.toLowerCase();
  await ensureUser(context, userId);

  context.SupplyEvent.set({
    id: getTxId(event),
    user: userId,
    protocol: "SPARK",
    asset: event.params.reserve.toLowerCase(),
    assetAddress: event.params.reserve.toLowerCase(),
    amount: event.params.amount,
    amountUSD: estimateUSD(event.params.amount),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.block.hash,
  });
});

SparkPool.Withdraw.handler(async ({ event, context }) => {
  context.WithdrawEvent.set({
    id: getTxId(event),
    user: event.params.user.toLowerCase(),
    protocol: "SPARK",
    asset: event.params.reserve.toLowerCase(),
    assetAddress: event.params.reserve.toLowerCase(),
    amount: event.params.amount,
    amountUSD: estimateUSD(event.params.amount),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.block.hash,
  });
});

SparkPool.LiquidationCall.handler(async ({ event, context }) => {
  const userId = event.params.user.toLowerCase();
  await ensureUser(context, userId);

  context.LiquidationEvent.set({
    id: getTxId(event),
    user_id: userId,
    liquidator: event.params.liquidator.toLowerCase(),
    protocol: "SPARK",
    collateralAsset: event.params.collateralAsset.toLowerCase(),
    collateralAssetAddress: event.params.collateralAsset.toLowerCase(),
    debtAsset: event.params.debtAsset.toLowerCase(),
    debtAssetAddress: event.params.debtAsset.toLowerCase(),
    debtToCover: event.params.debtToCover,
    liquidatedCollateralAmount: event.params.liquidatedCollateralAmount,
    liquidatedCollateralUSD: estimateUSD(event.params.liquidatedCollateralAmount),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.block.hash,
  });

  const user = await context.User.get(userId);
  if (user) {
    context.User.set({ ...user, totalLiquidations: user.totalLiquidations + 1 });
  }
});

// Compound V3 Handlers
CompoundV3Comet.Supply.handler(async ({ event, context }) => {
  const userId = event.params.dst.toLowerCase();
  await ensureUser(context, userId);

  context.SupplyEvent.set({
    id: getTxId(event),
    user: userId,
    protocol: "COMPOUND_V3",
    asset: "USDC",
    assetAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    amount: event.params.amount,
    amountUSD: estimateUSD(event.params.amount),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.block.hash,
  });
});

CompoundV3Comet.Withdraw.handler(async ({ event, context }) => {
  context.WithdrawEvent.set({
    id: getTxId(event),
    user: event.params.from.toLowerCase(),
    protocol: "COMPOUND_V3",
    asset: "USDC",
    assetAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    amount: event.params.amount,
    amountUSD: estimateUSD(event.params.amount),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.block.hash,
  });
});

CompoundV3Comet.AbsorbCollateral.handler(async ({ event, context }) => {
  const borrower = event.params.borrower.toLowerCase();
  await ensureUser(context, borrower);

  context.LiquidationEvent.set({
    id: getTxId(event),
    user_id: borrower,
    liquidator: event.params.absorber.toLowerCase(),
    protocol: "COMPOUND_V3",
    collateralAsset: event.params.asset.toLowerCase(),
    collateralAssetAddress: event.params.asset.toLowerCase(),
    debtAsset: "USDC",
    debtAssetAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    debtToCover: 0n,
    liquidatedCollateralAmount: event.params.collateralAbsorbed,
    liquidatedCollateralUSD: event.params.usdValue,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.block.hash,
  });

  const user = await context.User.get(borrower);
  if (user) {
    context.User.set({ ...user, totalLiquidations: user.totalLiquidations + 1 });
  }
});

CompoundV3Comet.AbsorbDebt.handler(async ({ event, context }) => {
  // Track debt absorption - part of liquidation process
});

CompoundV3Comet.BuyCollateral.handler(async ({ event, context }) => {
  // Track collateral purchase by liquidators - informational
});
