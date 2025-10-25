/**
 * Envio API Routes
 * Endpoints to fetch lending data from Envio indexer
 */

import { Router, Request, Response } from 'express';
import { getEnvioClient } from '../envio-client.js';
import { getPairingByEvm } from '../database.js';

const router = Router();
const envioClient = getEnvioClient();

/**
 * GET /api/envio/loans/:evmAddress
 * Get all loan positions for a specific EVM address
 */
router.get('/loans/:evmAddress', async (req: Request, res: Response) => {
  try {
    const { evmAddress } = req.params;
    
    const loans = await envioClient.getUserLoans(evmAddress);
    
    res.json({
      success: true,
      evmAddress: evmAddress.toLowerCase(),
      totalLoans: loans.length,
      activeLoans: loans.filter(l => l.isActive).length,
      loans
    });
  } catch (error: any) {
    console.error('Error fetching user loans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch loan data',
      message: error.message
    });
  }
});

/**
 * GET /api/envio/repayments/:evmAddress
 * Get repayment history for a specific EVM address
 */
router.get('/repayments/:evmAddress', async (req: Request, res: Response) => {
  try {
    const { evmAddress } = req.params;
    
    const repayments = await envioClient.getUserRepayments(evmAddress);
    
    // Calculate total repaid
    const totalRepaid = repayments.reduce(
      (sum, r) => sum + BigInt(r.amountUSD || '0'),
      BigInt(0)
    ).toString();
    
    res.json({
      success: true,
      evmAddress: evmAddress.toLowerCase(),
      totalRepayments: repayments.length,
      totalRepaidUSD: totalRepaid,
      repayments
    });
  } catch (error: any) {
    console.error('Error fetching repayments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repayment data',
      message: error.message
    });
  }
});

/**
 * GET /api/envio/liquidations/:evmAddress
 * Get liquidation history for a specific EVM address
 */
router.get('/liquidations/:evmAddress', async (req: Request, res: Response) => {
  try {
    const { evmAddress } = req.params;
    
    const liquidations = await envioClient.getUserLiquidations(evmAddress);
    
    // Calculate total liquidated collateral value
    const totalLiquidatedUSD = liquidations.reduce(
      (sum, l) => sum + BigInt(l.liquidatedCollateralUSD || '0'),
      BigInt(0)
    ).toString();
    
    res.json({
      success: true,
      evmAddress: evmAddress.toLowerCase(),
      totalLiquidations: liquidations.length,
      totalLiquidatedUSD,
      liquidations
    });
  } catch (error: any) {
    console.error('Error fetching liquidation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch liquidation history',
      message: error.message
    });
  }
});

/**
 * GET /api/envio/summary/:evmAddress
 * Get comprehensive loan summary (loans, repayments, liquidations, LTV)
 */
router.get('/summary/:evmAddress', async (req: Request, res: Response) => {
  try {
    const { evmAddress } = req.params;
    
    const summary = await envioClient.getUserLoanSummary(evmAddress);
    
    res.json({
      success: true,
      summary
    });
  } catch (error: any) {
    console.error('Error fetching loan summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch loan summary',
      message: error.message
    });
  }
});

/**
 * GET /api/envio/paired-wallet/:concordiumAddress
 * Get loan data for all EVM addresses paired with a Concordium address
 */
router.get('/paired-wallet/:concordiumAddress', async (req: Request, res: Response) => {
  try {
    const { concordiumAddress } = req.params;
    
    // Get pairing from database
    const { getPairingByConcordium } = await import('../database.js');
    const pairing = await getPairingByConcordium(concordiumAddress);
    
    if (!pairing) {
      return res.status(404).json({
        success: false,
        error: 'No wallet pairing found for this Concordium address'
      });
    }
    
    // Fetch loan data for all paired EVM addresses
    const evmWalletsData = await Promise.all(
      pairing.evmAddresses.map(async (evmAddress) => {
        try {
          const summary = await envioClient.getUserLoanSummary(evmAddress);
          return {
            evmAddress,
            success: true,
            data: summary
          };
        } catch (error: any) {
          return {
            evmAddress,
            success: false,
            error: error.message
          };
        }
      })
    );
    
    // Aggregate statistics
    const aggregated = {
      totalBorrowedUSD: evmWalletsData.reduce(
        (sum, w) => sum + BigInt((w.success && w.data) ? w.data.totalBorrowedUSD : '0'),
        BigInt(0)
      ).toString(),
      totalRepaidUSD: evmWalletsData.reduce(
        (sum, w) => sum + BigInt((w.success && w.data) ? w.data.totalRepaidUSD : '0'),
        BigInt(0)
      ).toString(),
      totalActiveLoans: evmWalletsData.reduce(
        (sum, w) => sum + ((w.success && w.data) ? w.data.activeLoans : 0),
        0
      ),
      totalLiquidations: evmWalletsData.reduce(
        (sum, w) => sum + ((w.success && w.data) ? w.data.liquidations.length : 0),
        0
      ),
    };
    
    res.json({
      success: true,
      concordiumAddress,
      pairedWallets: pairing.evmAddresses.length,
      aggregated,
      walletsData: evmWalletsData
    });
  } catch (error: any) {
    console.error('Error fetching paired wallet data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch paired wallet data',
      message: error.message
    });
  }
});

/**
 * GET /api/envio/health
 * Check if Envio indexer is reachable
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const isHealthy = await envioClient.healthCheck();
    
    res.json({
      success: true,
      envioStatus: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      envioStatus: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
