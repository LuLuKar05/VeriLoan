/**
 * Hasura GraphQL Client
 * Queries DeFi lending data from Hasura GraphQL API (localhost:8080)
 * Data is sourced from PostgreSQL database populated by blockchain indexers
 */

import fetch from 'node-fetch';

/**
 * Configuration for Hasura connection
 */
const HASURA_ENDPOINT = process.env.HASURA_ENDPOINT || 'http://localhost:8080/v1/graphql';
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET || '';

/**
 * Loan position data structure
 */
export interface LoanPosition {
    id: string;
    user: string;
    protocol: string;
    asset: string;
    amount: string;
    amountUSD: string;
    timestamp: number;
    blockNumber: number;
    transactionHash: string;
    isActive: boolean;
    collateralAmount?: string;
    borrowRate?: string;
}

/**
 * Repayment event data structure
 */
export interface RepaymentEvent {
    id: string;
    user: string;
    protocol: string;
    asset: string;
    amount: string;
    amountUSD: string;
    timestamp: number;
    blockNumber: number;
    transactionHash: string;
}

/**
 * Liquidation event data structure
 */
export interface LiquidationEvent {
    id: string;
    user: string;
    protocol: string;
    collateralAsset: string;
    debtAsset: string;
    liquidatedCollateralAmount: string;
    liquidatedCollateralUSD: string;
    debtToCover: string;
    debtToCoverUSD: string;
    timestamp: number;
    blockNumber: number;
    transactionHash: string;
    liquidator: string;
}

/**
 * Comprehensive loan summary
 */
export interface LoanSummary {
    evmAddress: string;
    totalBorrowedUSD: string;
    totalRepaidUSD: string;
    activeLoans: number;
    loans: LoanPosition[];
    repayments: RepaymentEvent[];
    liquidations: LiquidationEvent[];
    currentLTV?: number;
    healthFactor?: number;
}

/**
 * Hasura GraphQL Client
 * Fetches DeFi lending data from Hasura PostgreSQL database
 */
export class HasuraClient {
    private endpoint: string;
    private headers: Record<string, string>;

    constructor(endpoint?: string, adminSecret?: string) {
        this.endpoint = endpoint || HASURA_ENDPOINT;
        this.headers = {
            'Content-Type': 'application/json',
        };

        if (adminSecret || HASURA_ADMIN_SECRET) {
            this.headers['x-hasura-admin-secret'] = adminSecret || HASURA_ADMIN_SECRET;
        }
    }

    /**
     * Execute a GraphQL query against Hasura
     */
    private async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ query, variables }),
            });

            if (!response.ok) {
                throw new Error(`Hasura request failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json() as any;

            if (result.errors) {
                throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
            }

            return result.data as T;
        } catch (error: any) {
            console.error('Hasura query error:', error);
            throw new Error(`Failed to query Hasura: ${error.message}`);
        }
    }

    /**
     * Get all loan positions for a user
     */
    async getUserLoans(evmAddress: string): Promise<LoanPosition[]> {
        try {
            const query = `
        query GetUserLoans($user: String!) {
          loans(
            where: { user: { _ilike: $user } }
            order_by: { timestamp: desc }
          ) {
            id
            user
            protocol
            asset
            amount
            amountUSD
            timestamp
            blockNumber
            transactionHash
            isActive
            collateralAmount
            borrowRate
          }
        }
      `;

            const data = await this.query<{ loans: LoanPosition[] }>(query, {
                user: evmAddress.toLowerCase(),
            });

            return data.loans || [];
        } catch (error: any) {
            console.warn(`⚠️  No loans found for ${evmAddress}:`, error.message);
            return []; // Return empty array if not found
        }
    }

    /**
     * Get repayment history for a user
     */
    async getUserRepayments(evmAddress: string): Promise<RepaymentEvent[]> {
        try {
            const query = `
        query GetUserRepayments($user: String!) {
          repayments(
            where: { user: { _ilike: $user } }
            order_by: { timestamp: desc }
          ) {
            id
            user
            protocol
            asset
            amount
            amountUSD
            timestamp
            blockNumber
            transactionHash
          }
        }
      `;

            const data = await this.query<{ repayments: RepaymentEvent[] }>(query, {
                user: evmAddress.toLowerCase(),
            });

            return data.repayments || [];
        } catch (error: any) {
            console.warn(`⚠️  No repayments found for ${evmAddress}:`, error.message);
            return []; // Return empty array if not found
        }
    }

    /**
     * Get liquidation events for a user
     */
    async getUserLiquidations(evmAddress: string): Promise<LiquidationEvent[]> {
        try {
            const query = `
        query GetUserLiquidations($user: String!) {
          liquidations(
            where: { user: { _ilike: $user } }
            order_by: { timestamp: desc }
          ) {
            id
            user
            protocol
            collateralAsset
            debtAsset
            liquidatedCollateralAmount
            liquidatedCollateralUSD
            debtToCover
            debtToCoverUSD
            timestamp
            blockNumber
            transactionHash
            liquidator
          }
        }
      `;

            const data = await this.query<{ liquidations: LiquidationEvent[] }>(query, {
                user: evmAddress.toLowerCase(),
            });

            return data.liquidations || [];
        } catch (error: any) {
            console.warn(`⚠️  No liquidations found for ${evmAddress}:`, error.message);
            return []; // Return empty array if not found
        }
    }

    /**
     * Get comprehensive loan summary including LTV and health factor
     */
    async getUserLoanSummary(evmAddress: string): Promise<LoanSummary> {
        const [loans, repayments, liquidations] = await Promise.all([
            this.getUserLoans(evmAddress),
            this.getUserRepayments(evmAddress),
            this.getUserLiquidations(evmAddress),
        ]);

        // Calculate totals
        const totalBorrowedUSD = loans.reduce(
            (sum, loan) => sum + BigInt(loan.amountUSD || '0'),
            BigInt(0)
        ).toString();

        const totalRepaidUSD = repayments.reduce(
            (sum, repayment) => sum + BigInt(repayment.amountUSD || '0'),
            BigInt(0)
        ).toString();

        const activeLoans = loans.filter(loan => loan.isActive).length;

        // Calculate health metrics
        let currentLTV: number | undefined;
        let healthFactor: number | undefined;

        if (activeLoans > 0) {
            const totalCollateralUSD = loans
                .filter(loan => loan.isActive && loan.collateralAmount)
                .reduce((sum, loan) => sum + parseFloat(loan.amountUSD || '0'), 0);

            const totalDebtUSD = parseFloat(totalBorrowedUSD) - parseFloat(totalRepaidUSD);

            if (totalCollateralUSD > 0) {
                currentLTV = (totalDebtUSD / totalCollateralUSD) * 100;
                healthFactor = totalCollateralUSD / totalDebtUSD;
            }
        }

        return {
            evmAddress: evmAddress.toLowerCase(),
            totalBorrowedUSD,
            totalRepaidUSD,
            activeLoans,
            loans,
            repayments,
            liquidations,
            currentLTV,
            healthFactor,
        };
    }

    /**
     * Health check - verify Hasura connection
     */
    async healthCheck(): Promise<{ healthy: boolean; message: string }> {
        try {
            const query = `
        query HealthCheck {
          __schema {
            queryType {
              name
            }
          }
        }
      `;

            await this.query(query);

            return {
                healthy: true,
                message: 'Hasura connection successful',
            };
        } catch (error: any) {
            return {
                healthy: false,
                message: `Hasura connection failed: ${error.message}`,
            };
        }
    }
}

/**
 * Singleton instance
 */
let hasuraClientInstance: HasuraClient | null = null;

/**
 * Get or create Hasura client instance
 */
export function getHasuraClient(): HasuraClient {
    if (!hasuraClientInstance) {
        hasuraClientInstance = new HasuraClient();
        console.log('✅ Hasura client initialized:', HASURA_ENDPOINT);
    }
    return hasuraClientInstance;
}

/**
 * Create a new Hasura client with custom configuration
 */
export function createHasuraClient(endpoint: string, adminSecret?: string): HasuraClient {
    return new HasuraClient(endpoint, adminSecret);
}
