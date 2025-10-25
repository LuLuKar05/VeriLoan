// TypeScript Client for Envio DeFi Lending Indexer
// Install: npm install graphql-request graphql

import { GraphQLClient, gql } from 'graphql-request';

// GraphQL endpoint
const GRAPHQL_ENDPOINT = 'http://localhost:8080/v1/graphql';

// Initialize the client
const client = new GraphQLClient(GRAPHQL_ENDPOINT);

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

// ==================== QUERY FUNCTIONS ====================

/**
 * Get user's complete lending profile
 */
export async function getUserProfile(walletAddress: string): Promise<User | null> {
    const query = gql`
    query GetUserProfile($address: String!) {
      user(id: $address) {
        id
        totalBorrowsUSD
        totalSuppliesUSD
        totalLiquidations
      }
    }
  `;

    const variables = {
        address: walletAddress.toLowerCase(), // Important: use lowercase!
    };

    const data = await client.request<{ user: User | null }>(query, variables);
    return data.user;
}

/**
 * Get user's borrow history
 */
export async function getUserBorrows(
    walletAddress: string,
    limit: number = 50
): Promise<BorrowEvent[]> {
    const query = gql`
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

    const variables = {
        address: walletAddress.toLowerCase(),
        limit,
    };

    const data = await client.request<{ borrowEvents: BorrowEvent[] }>(query, variables);
    return data.borrowEvents;
}

/**
 * Get user's supply/deposit history
 */
export async function getUserSupplies(
    walletAddress: string,
    limit: number = 50
): Promise<SupplyEvent[]> {
    const query = gql`
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

    const variables = {
        address: walletAddress.toLowerCase(),
        limit,
    };

    const data = await client.request<{ supplyEvents: SupplyEvent[] }>(query, variables);
    return data.supplyEvents;
}

/**
 * Get user's liquidation history
 */
export async function getUserLiquidations(
    walletAddress: string
): Promise<LiquidationEvent[]> {
    const query = gql`
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

    const variables = {
        address: walletAddress.toLowerCase(),
    };

    const data = await client.request<{ liquidationEvents: LiquidationEvent[] }>(
        query,
        variables
    );
    return data.liquidationEvents;
}

/**
 * Get user's complete lending history (all events)
 */
export async function getUserCompleteHistory(walletAddress: string) {
    const query = gql`
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

    const variables = {
        address: walletAddress.toLowerCase(),
    };

    return await client.request(query, variables);
}

/**
 * Get all recent liquidations across all protocols
 */
export async function getRecentLiquidations(
    limit: number = 50
): Promise<LiquidationEvent[]> {
    const query = gql`
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

    const data = await client.request<{ liquidationEvents: LiquidationEvent[] }>(query, {
        limit,
    });
    return data.liquidationEvents;
}

/**
 * Get protocol statistics
 */
export async function getProtocolStats() {
    const query = gql`
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

    return await client.request(query);
}

/**
 * Search for high-value liquidations
 */
export async function getHighValueLiquidations(
    minValueUSD: string,
    limit: number = 20
): Promise<LiquidationEvent[]> {
    const query = gql`
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

    const data = await client.request<{ liquidationEvents: LiquidationEvent[] }>(query, {
        minValue: minValueUSD,
        limit,
    });
    return data.liquidationEvents;
}

// ==================== USAGE EXAMPLES ====================

// Example 1: Get user profile
async function example1() {
    const user = await getUserProfile('0x742d35cc6634c0532925a3b844bc9e7595f0beb');
    console.log('User Profile:', user);
}

// Example 2: Get user's borrow history
async function example2() {
    const borrows = await getUserBorrows(
        '0x742d35cc6634c0532925a3b844bc9e7595f0beb',
        10
    );
    console.log('Borrow History:', borrows);
}

// Example 3: Get complete user history
async function example3() {
    const history = await getUserCompleteHistory(
        '0x742d35cc6634c0532925a3b844bc9e7595f0beb'
    );
    console.log('Complete History:', JSON.stringify(history, null, 2));
}

// Example 4: Monitor recent liquidations
async function example4() {
    const liquidations = await getRecentLiquidations(20);
    console.log('Recent Liquidations:', liquidations);
}

// Example 5: Get protocol statistics
async function example5() {
    const stats = await getProtocolStats();
    console.log('Protocol Stats:', stats);
}

// Run examples
if (require.main === module) {
    // Uncomment to test:
    // example1();
    // example2();
    // example3();
    // example4();
    // example5();
}
