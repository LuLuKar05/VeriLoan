// TypeScript Client for Envio DeFi Lending Indexer (Native Fetch - No Dependencies)

const GRAPHQL_ENDPOINT = 'http://localhost:8080/v1/graphql';

// ==================== TYPE DEFINITIONS ====================

interface User {
    id: string;
    totalBorrowsUSD: string;
    totalSuppliesUSD: string;
    totalLiquidations: number;
}

interface BorrowEvent {
    id: string;
    user: string;
    protocol: 'AAVE_V3' | 'COMPOUND_V3' | 'SPARK';
    asset: string;
    assetAddress: string;
    amount: string;
    amountUSD: string;
    borrowRate: string;
    timestamp: string;
    blockNumber: string;
    transactionHash: string;
}

interface SupplyEvent {
    id: string;
    user: string;
    protocol: 'AAVE_V3' | 'COMPOUND_V3' | 'SPARK';
    asset: string;
    assetAddress: string;
    amount: string;
    amountUSD: string;
    timestamp: string;
    blockNumber: string;
    transactionHash: string;
}

interface LiquidationEvent {
    id: string;
    user_id: string;
    liquidator: string;
    protocol: 'AAVE_V3' | 'COMPOUND_V3' | 'SPARK';
    collateralAsset: string;
    collateralAssetAddress: string;
    debtAsset: string;
    debtAssetAddress: string;
    debtToCover: string;
    liquidatedCollateralAmount: string;
    liquidatedCollateralUSD: string;
    timestamp: string;
    blockNumber: string;
    transactionHash: string;
}

// ==================== GRAPHQL CLIENT ====================

async function queryGraphQL<T = any>(
    query: string,
    variables?: Record<string, any>
): Promise<T> {
    const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables,
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
        throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
    }

    return result.data as T;
}

// ==================== QUERY FUNCTIONS ====================

/**
 * Get user's complete lending profile
 */
export async function getUserProfile(walletAddress: string): Promise<User | null> {
    const query = `
    query GetUserProfile($address: String!) {
      user(id: $address) {
        id
        totalBorrowsUSD
        totalSuppliesUSD
        totalLiquidations
      }
    }
  `;

    const data = await queryGraphQL<{ user: User | null }>(query, {
        address: walletAddress.toLowerCase(),
    });

    return data.user;
}

/**
 * Get user's borrow history
 */
export async function getUserBorrows(
    walletAddress: string,
    limit: number = 50
): Promise<BorrowEvent[]> {
    const query = `
    query GetUserBorrows($address: String!, $limit: Int!) {
      borrowEvents(
        where: { user: { _eq: $address } }
        orderBy: { timestamp: desc }
        limit: $limit
      ) {
        id
        user
        protocol
        asset
        assetAddress
        amount
        amountUSD
        borrowRate
        timestamp
        blockNumber
        transactionHash
      }
    }
  `;

    const data = await queryGraphQL<{ borrowEvents: BorrowEvent[] }>(query, {
        address: walletAddress.toLowerCase(),
        limit,
    });

    return data.borrowEvents;
}

/**
 * Get user's supply/deposit history
 */
export async function getUserSupplies(
    walletAddress: string,
    limit: number = 50
): Promise<SupplyEvent[]> {
    const query = `
    query GetUserSupplies($address: String!, $limit: Int!) {
      supplyEvents(
        where: { user: { _eq: $address } }
        orderBy: { timestamp: desc }
        limit: $limit
      ) {
        id
        user
        protocol
        asset
        assetAddress
        amount
        amountUSD
        timestamp
        blockNumber
        transactionHash
      }
    }
  `;

    const data = await queryGraphQL<{ supplyEvents: SupplyEvent[] }>(query, {
        address: walletAddress.toLowerCase(),
        limit,
    });

    return data.supplyEvents;
}

/**
 * Get user's liquidation history
 */
export async function getUserLiquidations(
    walletAddress: string
): Promise<LiquidationEvent[]> {
    const query = `
    query GetUserLiquidations($address: String!) {
      liquidationEvents(
        where: { user_id: { _eq: $address } }
        orderBy: { timestamp: desc }
      ) {
        id
        user_id
        liquidator
        protocol
        collateralAsset
        collateralAssetAddress
        debtAsset
        debtAssetAddress
        debtToCover
        liquidatedCollateralAmount
        liquidatedCollateralUSD
        timestamp
        blockNumber
        transactionHash
      }
    }
  `;

    const data = await queryGraphQL<{ liquidationEvents: LiquidationEvent[] }>(query, {
        address: walletAddress.toLowerCase(),
    });

    return data.liquidationEvents;
}

/**
 * Get user's complete lending history (all events in one query)
 */
export async function getUserCompleteHistory(walletAddress: string) {
    const query = `
    query GetCompleteHistory($address: String!) {
      user(id: $address) {
        id
        totalBorrowsUSD
        totalSuppliesUSD
        totalLiquidations
      }

      borrowEvents(
        where: { user: { _eq: $address } }
        orderBy: { timestamp: desc }
        limit: 100
      ) {
        protocol
        asset
        amount
        amountUSD
        timestamp
        blockNumber
      }

      supplyEvents(
        where: { user: { _eq: $address } }
        orderBy: { timestamp: desc }
        limit: 100
      ) {
        protocol
        asset
        amount
        amountUSD
        timestamp
        blockNumber
      }

      repayEvents(
        where: { user: { _eq: $address } }
        orderBy: { timestamp: desc }
        limit: 100
      ) {
        protocol
        asset
        amount
        amountUSD
        timestamp
        blockNumber
      }

      withdrawEvents(
        where: { user: { _eq: $address } }
        orderBy: { timestamp: desc }
        limit: 100
      ) {
        protocol
        asset
        amount
        amountUSD
        timestamp
        blockNumber
      }

      liquidationEvents(
        where: { user_id: { _eq: $address } }
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
  `;

    return await queryGraphQL(query, {
        address: walletAddress.toLowerCase(),
    });
}

/**
 * Get all recent liquidations across all protocols
 */
export async function getRecentLiquidations(
    limit: number = 50
): Promise<LiquidationEvent[]> {
    const query = `
    query GetRecentLiquidations($limit: Int!) {
      liquidationEvents(orderBy: { timestamp: desc }, limit: $limit) {
        id
        user_id
        liquidator
        protocol
        collateralAsset
        debtAsset
        liquidatedCollateralAmount
        liquidatedCollateralUSD
        timestamp
        blockNumber
      }
    }
  `;

    const data = await queryGraphQL<{ liquidationEvents: LiquidationEvent[] }>(query, {
        limit,
    });

    return data.liquidationEvents;
}

/**
 * Get protocol statistics
 */
export async function getProtocolStats() {
    const query = `
    query GetProtocolStats {
      borrowEvents_aggregate {
        aggregate {
          count
        }
      }
      supplyEvents_aggregate {
        aggregate {
          count
        }
      }
      liquidationEvents_aggregate {
        aggregate {
          count
        }
      }
      users_aggregate {
        aggregate {
          count
        }
      }
    }
  `;

    return await queryGraphQL(query);
}

/**
 * Get users with the most liquidations
 */
export async function getTopLiquidatedUsers(limit: number = 10) {
    const query = `
    query GetTopLiquidatedUsers($limit: Int!) {
      users(
        where: { totalLiquidations: { _gt: 0 } }
        orderBy: { totalLiquidations: desc }
        limit: $limit
      ) {
        id
        totalBorrowsUSD
        totalSuppliesUSD
        totalLiquidations
      }
    }
  `;

    return await queryGraphQL(query, { limit });
}

/**
 * Search for high-value liquidations
 */
export async function getHighValueLiquidations(
    minValueUSD: string,
    limit: number = 20
): Promise<LiquidationEvent[]> {
    const query = `
    query GetHighValueLiquidations($minValue: bigint!, $limit: Int!) {
      liquidationEvents(
        where: { liquidatedCollateralUSD: { _gt: $minValue } }
        orderBy: { liquidatedCollateralUSD: desc }
        limit: $limit
      ) {
        id
        user_id
        liquidator
        protocol
        collateralAsset
        debtAsset
        liquidatedCollateralAmount
        liquidatedCollateralUSD
        timestamp
        blockNumber
      }
    }
  `;

    const data = await queryGraphQL<{ liquidationEvents: LiquidationEvent[] }>(query, {
        minValue: minValueUSD,
        limit,
    });

    return data.liquidationEvents;
}

// ==================== USAGE EXAMPLES ====================

// Example 1: Get user profile
async function example1() {
    try {
        const user = await getUserProfile('0x742d35cc6634c0532925a3b844bc9e7595f0beb');
        console.log('User Profile:', user);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Example 2: Get user's borrow history
async function example2() {
    try {
        const borrows = await getUserBorrows(
            '0x742d35cc6634c0532925a3b844bc9e7595f0beb',
            10
        );
        console.log('Borrow History:', borrows);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Example 3: Get complete user history
async function example3() {
    try {
        const history = await getUserCompleteHistory(
            '0x742d35cc6634c0532925a3b844bc9e7595f0beb'
        );
        console.log('Complete History:', JSON.stringify(history, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

// Example 4: Monitor recent liquidations
async function example4() {
    try {
        const liquidations = await getRecentLiquidations(20);
        console.log('Recent Liquidations:', liquidations);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Example 5: Get protocol statistics
async function example5() {
    try {
        const stats = await getProtocolStats();
        console.log('Protocol Stats:', stats);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Example 6: Get top liquidated users
async function example6() {
    try {
        const topUsers = await getTopLiquidatedUsers(5);
        console.log('Top Liquidated Users:', topUsers);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Uncomment to run examples:
// example1();
// example2();
// example3();
// example4();
// example5();
// example6();
