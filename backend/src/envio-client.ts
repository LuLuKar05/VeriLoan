/**
 * Envio GraphQL Client Integration
 * Fetches lending data (loans, repayments, liquidations, LTV) from Envio indexer
 */

export interface LoanData {
  id: string;
  user: string;
  protocol: 'AAVE_V3' | 'COMPOUND_V3' | 'SPARK';
  asset: string;
  assetAddress: string;
  borrowedAmount: string;
  borrowedAmountUSD: string;
  collateralAmount: string;
  collateralAmountUSD: string;
  collateralAsset: string;
  loanToValue: string;
  healthFactor: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  transactionHash: string;
}

export interface RepaymentData {
  id: string;
  user: string;
  protocol: 'AAVE_V3' | 'COMPOUND_V3' | 'SPARK';
  asset: string;
  amount: string;
  amountUSD: string;
  timestamp: string;
  transactionHash: string;
}

export interface LiquidationData {
  id: string;
  user: string;
  liquidator: string;
  protocol: 'AAVE_V3' | 'COMPOUND_V3' | 'SPARK';
  collateralAsset: string;
  debtAsset: string;
  debtToCover: string;
  liquidatedCollateralAmount: string;
  liquidatedCollateralUSD: string;
  timestamp: string;
  transactionHash: string;
}

export interface UserLoanSummary {
  evmAddress: string;
  totalLoans: number;
  activeLoans: number;
  totalBorrowedUSD: string;
  totalRepaidUSD: string;
  averageLTV: number;
  healthFactor: string;
  loans: LoanData[];
  repayments: RepaymentData[];
  liquidations: LiquidationData[];
}

export class EnvioClient {
  private graphqlEndpoint: string;

  constructor(endpoint?: string) {
    this.graphqlEndpoint = endpoint || process.env.ENVIO_GRAPHQL_ENDPOINT || 'http://localhost:8080/v1/graphql';
  }

  /**
   * Execute GraphQL query
   */
  private async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
    try {
      const response = await fetch(this.graphqlEndpoint, {
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
        throw new Error(`GraphQL request failed: ${response.statusText}`);
      }

      const result: any = await response.json();

      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      return result.data;
    } catch (error: any) {
      console.error('Envio GraphQL query error:', error);
      throw new Error(`Failed to fetch data from Envio: ${error.message}`);
    }
  }

  /**
   * Get all loan positions for a user
   */
  async getUserLoans(evmAddress: string): Promise<LoanData[]> {
    const query = `
      query GetUserLoans($userId: ID!) {
        User(id: $userId) {
          loanPositions {
            id
            protocol
            asset
            assetAddress
            borrowedAmount
            borrowedAmountUSD
            collateralAmount
            collateralAmountUSD
            collateralAsset
            collateralAssetAddress
            loanToValue
            liquidationThreshold
            healthFactor
            isActive
            createdAt
            updatedAt
            transactionHash
          }
        }
      }
    `;

    const result = await this.query<{ User: { loanPositions: LoanData[] } | null }>(query, {
      userId: evmAddress.toLowerCase(),
    });

    return result.User?.loanPositions || [];
  }

  /**
   * Get all repayment events for a user
   */
  async getUserRepayments(evmAddress: string): Promise<RepaymentData[]> {
    const query = `
      query GetUserRepayments($user: String!) {
        RepayEvent(where: { user: { _eq: $user } }, order_by: { timestamp: desc }) {
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

    const result = await this.query<{ RepayEvent: RepaymentData[] }>(query, {
      user: evmAddress.toLowerCase(),
    });

    return result.RepayEvent || [];
  }

  /**
   * Get liquidation history for a user
   */
  async getUserLiquidations(evmAddress: string): Promise<LiquidationData[]> {
    const query = `
      query GetUserLiquidations($userId: ID!) {
        User(id: $userId) {
          liquidations {
            id
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
      }
    `;

    const result = await this.query<{ User: { liquidations: LiquidationData[] } | null }>(query, {
      userId: evmAddress.toLowerCase(),
    });

    return result.User?.liquidations || [];
  }

  /**
   * Get comprehensive loan summary for a user
   */
  async getUserLoanSummary(evmAddress: string): Promise<UserLoanSummary> {
    const [loans, repayments, liquidations] = await Promise.all([
      this.getUserLoans(evmAddress),
      this.getUserRepayments(evmAddress),
      this.getUserLiquidations(evmAddress),
    ]);

    const activeLoans = loans.filter(loan => loan.isActive);
    
    // Calculate total borrowed (sum of all active loans)
    const totalBorrowedUSD = activeLoans.reduce(
      (sum, loan) => sum + BigInt(loan.borrowedAmountUSD || '0'),
      BigInt(0)
    ).toString();

    // Calculate total repaid (sum of all repayment events)
    const totalRepaidUSD = repayments.reduce(
      (sum, repay) => sum + BigInt(repay.amountUSD || '0'),
      BigInt(0)
    ).toString();

    // Calculate average LTV
    const avgLTV = activeLoans.length > 0
      ? activeLoans.reduce((sum, loan) => sum + Number(loan.loanToValue || 0), 0) / activeLoans.length / 100
      : 0;

    // Get minimum health factor (most at risk)
    const minHealthFactor = activeLoans.length > 0
      ? Math.min(...activeLoans.map(loan => Number(loan.healthFactor || '0'))) / 1e18
      : 0;

    return {
      evmAddress: evmAddress.toLowerCase(),
      totalLoans: loans.length,
      activeLoans: activeLoans.length,
      totalBorrowedUSD,
      totalRepaidUSD,
      averageLTV: Math.round(avgLTV * 100) / 100,
      healthFactor: minHealthFactor.toFixed(2),
      loans,
      repayments,
      liquidations,
    };
  }

  /**
   * Get user data by wallet address
   */
  async getUser(evmAddress: string) {
    const query = `
      query GetUser($userId: ID!) {
        User(id: $userId) {
          id
          totalBorrowsUSD
          totalSuppliesUSD
          totalLiquidations
        }
      }
    `;

    const result = await this.query<{ User: any }>(query, {
      userId: evmAddress.toLowerCase(),
    });

    return result.User;
  }

  /**
   * Check if Envio indexer is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const query = `
        query HealthCheck {
          User(limit: 1) {
            id
          }
        }
      `;
      
      await this.query(query);
      return true;
    } catch (error) {
      console.error('Envio health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
let envioClient: EnvioClient | null = null;

/**
 * Get or create Envio client instance
 */
export function getEnvioClient(): EnvioClient {
  if (!envioClient) {
    envioClient = new EnvioClient();
  }
  return envioClient;
}
