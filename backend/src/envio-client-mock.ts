/**
 * Mock Envio Client for Testing
 * Use this when Envio indexer is not available
 */

import {
  LoanData,
  RepaymentData,
  LiquidationData,
  UserLoanSummary,
} from './envio-client';

export class MockEnvioClient {
  /**
   * Get mock user loans
   */
  async getUserLoans(evmAddress: string): Promise<LoanData[]> {
    console.log(`[MOCK] Fetching loans for ${evmAddress}`);
    
    return [
      {
        id: `${evmAddress}-aave-usdc-1`,
        user: evmAddress.toLowerCase(),
        protocol: 'AAVE_V3',
        asset: 'USDC',
        assetAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        borrowedAmount: '5000000000',
        borrowedAmountUSD: '5000000000',
        collateralAmount: '2000000000000000000',
        collateralAmountUSD: '4000000000',
        collateralAsset: 'ETH',
        loanToValue: '7500',
        healthFactor: '1250000000000000000',
        isActive: true,
        createdAt: '1698765432',
        updatedAt: '1698765432',
        transactionHash: '0xabcdef1234567890',
      },
      {
        id: `${evmAddress}-compound-dai-1`,
        user: evmAddress.toLowerCase(),
        protocol: 'COMPOUND_V3',
        asset: 'DAI',
        assetAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
        borrowedAmount: '3000000000000000000000',
        borrowedAmountUSD: '3000000000',
        collateralAmount: '1500000000000000000',
        collateralAmountUSD: '3000000000',
        collateralAsset: 'ETH',
        loanToValue: '6500',
        healthFactor: '1450000000000000000',
        isActive: true,
        createdAt: '1698665432',
        updatedAt: '1698765432',
        transactionHash: '0xdef1234567890abc',
      },
    ];
  }

  /**
   * Get mock user repayments
   */
  async getUserRepayments(evmAddress: string): Promise<RepaymentData[]> {
    console.log(`[MOCK] Fetching repayments for ${evmAddress}`);
    
    return [
      {
        id: '1-12345-10',
        user: evmAddress.toLowerCase(),
        protocol: 'AAVE_V3',
        asset: 'USDC',
        amount: '1000000000',
        amountUSD: '1000000000',
        timestamp: '1698665432',
        transactionHash: '0x123abc456def',
      },
      {
        id: '1-12346-15',
        user: evmAddress.toLowerCase(),
        protocol: 'COMPOUND_V3',
        asset: 'DAI',
        amount: '500000000000000000000',
        amountUSD: '500000000',
        timestamp: '1698665532',
        transactionHash: '0x456def789ghi',
      },
    ];
  }

  /**
   * Get mock user liquidations
   */
  async getUserLiquidations(evmAddress: string): Promise<LiquidationData[]> {
    console.log(`[MOCK] Fetching liquidations for ${evmAddress}`);
    
    // Return empty array by default (no liquidations)
    return [];
  }

  /**
   * Get mock comprehensive loan summary
   */
  async getUserLoanSummary(evmAddress: string): Promise<UserLoanSummary> {
    console.log(`[MOCK] Fetching loan summary for ${evmAddress}`);
    
    const loans = await this.getUserLoans(evmAddress);
    const repayments = await this.getUserRepayments(evmAddress);
    const liquidations = await this.getUserLiquidations(evmAddress);

    const activeLoans = loans.filter(loan => loan.isActive);
    
    const totalBorrowedUSD = activeLoans.reduce(
      (sum, loan) => sum + BigInt(loan.borrowedAmountUSD || '0'),
      BigInt(0)
    ).toString();

    const totalRepaidUSD = repayments.reduce(
      (sum, repay) => sum + BigInt(repay.amountUSD || '0'),
      BigInt(0)
    ).toString();

    const avgLTV = activeLoans.length > 0
      ? activeLoans.reduce((sum, loan) => sum + Number(loan.loanToValue || 0), 0) / activeLoans.length / 100
      : 0;

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
   * Get mock user data
   */
  async getUser(evmAddress: string) {
    console.log(`[MOCK] Fetching user data for ${evmAddress}`);
    
    return {
      id: evmAddress.toLowerCase(),
      totalBorrowsUSD: 8000000000n,
      totalSuppliesUSD: 7000000000n,
      totalLiquidations: 0,
    };
  }

  /**
   * Mock health check
   */
  async healthCheck(): Promise<boolean> {
    console.log('[MOCK] Envio health check - returning healthy (mock mode)');
    return true;
  }
}

// Singleton instance
let mockEnvioClient: MockEnvioClient | null = null;

/**
 * Get or create mock Envio client instance
 */
export function getMockEnvioClient(): MockEnvioClient {
  if (!mockEnvioClient) {
    mockEnvioClient = new MockEnvioClient();
  }
  return mockEnvioClient;
}
