/**
 * Report Component - Frontend Only
 * Generates report directly in the browser without backend endpoint
 */

import React, { useState } from 'react';

interface ReportData {
  generatedAt: string;
  concordiumAddress: string;
  evmAddress: string;
  userIdentity: {
    firstName: string;
    lastName: string;
    fullName: string;
    nationality: string;
    ageVerified18Plus: boolean;
  };
  defiData: {
    loans: {
      total: number;
      active: number;
      inactive: number;
      totalBorrowedUSD: string;
    };
    repayments: {
      total: number;
      totalRepaidUSD: string;
    };
    liquidations: {
      total: number;
      totalLiquidatedUSD: string;
    };
    metrics: {
      currentDebtUSD: string;
      healthFactor: string;
    };
  };
}

interface ReportComponentProps {
  concordiumAddress: string;
  evmAddress: string;
  verifiedAttributes?: {
    firstName?: string;
    lastName?: string;
    nationality?: string;
    ageVerified?: boolean;
  };
  hasuraEndpoint?: string;
}

export const ReportComponent: React.FC<ReportComponentProps> = ({
  concordiumAddress,
  evmAddress,
  verifiedAttributes = {},
  hasuraEndpoint = 'http://localhost:8080/v1/graphql',
}) => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  /**
   * Query Hasura GraphQL directly from frontend
   */
  const queryHasura = async (query: string, variables: any) => {
    const response = await fetch(hasuraEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Hasura query failed: ${response.status}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  };

  /**
   * Generate report by fetching data from Hasura GraphQL
   */
  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {

      // Query loans
      const loansQuery = `
        query GetUserLoans($user: String!) {
          loans(
            where: { user: { _ilike: $user } }
            order_by: { timestamp: desc }
          ) {
            id
            protocol
            asset
            amount
            amountUSD
            isActive
            timestamp
          }
        }
      `;

      let loans: any[] = [];
      try {
        const loansData = await queryHasura(loansQuery, { user: evmAddress.toLowerCase() });
        loans = loansData.loans || [];
        if (loans.length > 0) {
          loans.forEach((loan, idx) => {
          });
        }
      } catch (err: any) {
      }

      // Query repayments
      const repaymentsQuery = `
        query GetUserRepayments($user: String!) {
          repayments(
            where: { user: { _ilike: $user } }
            order_by: { timestamp: desc }
          ) {
            id
            protocol
            asset
            amount
            amountUSD
            timestamp
          }
        }
      `;

      let repayments: any[] = [];
      try {
        const repaymentsData = await queryHasura(repaymentsQuery, { user: evmAddress.toLowerCase() });
        repayments = repaymentsData.repayments || [];
        if (repayments.length > 0) {
          repayments.forEach((rep, idx) => {
          });
        }
      } catch (err: any) {
      }

      // Query liquidations
      const liquidationsQuery = `
        query GetUserLiquidations($user: String!) {
          liquidations(
            where: { user: { _ilike: $user } }
            order_by: { timestamp: desc }
          ) {
            id
            protocol
            collateralAsset
            debtAsset
            liquidatedCollateralUSD
            timestamp
          }
        }
      `;

      let liquidations: any[] = [];
      try {
        const liquidationsData = await queryHasura(liquidationsQuery, { user: evmAddress.toLowerCase() });
        liquidations = liquidationsData.liquidations || [];
        if (liquidations.length > 0) {
          liquidations.forEach((liq, idx) => {
          });
        }
      } catch (err: any) {
      }

      // Calculate metrics
      const totalBorrowedUSD = loans.reduce((sum, loan) => sum + BigInt(loan.amountUSD || '0'), BigInt(0));
      const totalRepaidUSD = repayments.reduce((sum, rep) => sum + BigInt(rep.amountUSD || '0'), BigInt(0));
      const totalLiquidatedUSD = liquidations.reduce((sum, liq) => sum + BigInt(liq.liquidatedCollateralUSD || '0'), BigInt(0));
      const currentDebtUSD = totalBorrowedUSD - totalRepaidUSD;
      const activeLoans = loans.filter(l => l.isActive).length;
      const healthFactor = currentDebtUSD > BigInt(0) ? 'At Risk' : 'Healthy';

      console.log('   - Total Loans:', loans.length);
      console.log('   - Active Loans:', activeLoans);
      console.log('   - Total Borrowed (USD):', totalBorrowedUSD.toString());
      console.log('   - Total Repaid (USD):', totalRepaidUSD.toString());
      console.log('   - Total Liquidated (USD):', totalLiquidatedUSD.toString());
      console.log('   - Current Debt (USD):', currentDebtUSD.toString());
      console.log('   - Health Factor:', healthFactor);

      // Build report data
      const report: ReportData = {
        generatedAt: new Date().toISOString(),
        concordiumAddress,
        evmAddress,
        userIdentity: {
          firstName: verifiedAttributes.firstName || 'N/A',
          lastName: verifiedAttributes.lastName || 'N/A',
          fullName: `${verifiedAttributes.firstName || ''} ${verifiedAttributes.lastName || ''}`.trim() || 'N/A',
          nationality: verifiedAttributes.nationality || 'N/A',
          ageVerified18Plus: verifiedAttributes.ageVerified || false,
        },
        defiData: {
          loans: {
            total: loans.length,
            active: activeLoans,
            inactive: loans.length - activeLoans,
            totalBorrowedUSD: totalBorrowedUSD.toString(),
          },
          repayments: {
            total: repayments.length,
            totalRepaidUSD: totalRepaidUSD.toString(),
          },
          liquidations: {
            total: liquidations.length,
            totalLiquidatedUSD: totalLiquidatedUSD.toString(),
          },
          metrics: {
            currentDebtUSD: currentDebtUSD.toString(),
            healthFactor,
          },
        },
      };

      setReportData(report);
      setShowReport(true);
    } catch (err: any) {
      console.error('❌ Report generation failed:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData) return;

    const reportText = `
═══════════════════════════════════════════════════════════
VERILOAN USER REPORT
═══════════════════════════════════════════════════════════

Generated: ${new Date(reportData.generatedAt).toLocaleString()}
Concordium Address: ${reportData.concordiumAddress}
EVM Address: ${reportData.evmAddress}

───────────────────────────────────────────────────────────
USER IDENTITY
───────────────────────────────────────────────────────────

Name: ${reportData.userIdentity.fullName}
Country: ${reportData.userIdentity.nationality}
Age 18+: ${reportData.userIdentity.ageVerified18Plus ? 'YES ✓' : 'NO ✗'}

───────────────────────────────────────────────────────────
DEFI LENDING DATA
───────────────────────────────────────────────────────────

LOAN POSITIONS:
  • Total Loans: ${reportData.defiData.loans.total}
  • Active Loans: ${reportData.defiData.loans.active}
  • Inactive Loans: ${reportData.defiData.loans.inactive}
  • Total Borrowed: $${reportData.defiData.loans.totalBorrowedUSD}

REPAYMENT HISTORY:
  • Total Repayments: ${reportData.defiData.repayments.total}
  • Total Repaid: $${reportData.defiData.repayments.totalRepaidUSD}

LIQUIDATION EVENTS:
  • Total Liquidations: ${reportData.defiData.liquidations.total}
  • Total Liquidated: $${reportData.defiData.liquidations.totalLiquidatedUSD}

RISK METRICS:
  • Current Debt: $${reportData.defiData.metrics.currentDebtUSD}
  • Health Factor: ${reportData.defiData.metrics.healthFactor}

═══════════════════════════════════════════════════════════
END OF REPORT
═══════════════════════════════════════════════════════════
`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veriloan-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ marginTop: '20px' }}>
      {/* View Report Button */}
      {!showReport && (
        <button
          onClick={generateReport}
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: loading ? '#ccc' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          {loading ? '⏳ Generating Report...' : '📊 View Report'}
        </button>
      )}

      {/* Error Display */}
      {error && (
        <div
          style={{
            marginTop: '15px',
            padding: '15px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: '8px',
          }}
        >
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Report Display */}
      {showReport && reportData && (
        <div
          style={{
            marginTop: '20px',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>✅ User Report</h3>
            <div>
              <button
                onClick={downloadReport}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginRight: '10px',
                }}
              >
                💾 Download
              </button>
              <button
                onClick={() => setShowReport(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                ✕ Close
              </button>
            </div>
          </div>

          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: 0 }}>
            Generated: {new Date(reportData.generatedAt).toLocaleString()}
          </p>

          {/* User Identity Section */}
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h4 style={{ marginTop: 0 }}>👤 User Identity</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', width: '140px' }}>Name:</td>
                  <td style={{ padding: '8px' }}>{reportData.userIdentity.fullName}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Country:</td>
                  <td style={{ padding: '8px' }}>{reportData.userIdentity.nationality}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Age 18+:</td>
                  <td style={{ padding: '8px' }}>
                    {reportData.userIdentity.ageVerified18Plus ? (
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ YES</span>
                    ) : (
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✗ NO</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* DeFi Data Section */}
          <div>
            <h4>💰 DeFi Lending Data</h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div style={{ padding: '16px', backgroundColor: '#dbeafe', borderRadius: '8px', border: '1px solid #93c5fd' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>📊 Loans</h5>
                <p style={{ margin: '4px 0' }}><strong>Total:</strong> {reportData.defiData.loans.total}</p>
                <p style={{ margin: '4px 0' }}><strong>Active:</strong> {reportData.defiData.loans.active}</p>
                <p style={{ margin: '4px 0' }}><strong>Borrowed:</strong> ${reportData.defiData.loans.totalBorrowedUSD}</p>
              </div>

              <div style={{ padding: '16px', backgroundColor: '#d1fae5', borderRadius: '8px', border: '1px solid #6ee7b7' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>💳 Repayments</h5>
                <p style={{ margin: '4px 0' }}><strong>Total:</strong> {reportData.defiData.repayments.total}</p>
                <p style={{ margin: '4px 0' }}><strong>Repaid:</strong> ${reportData.defiData.repayments.totalRepaidUSD}</p>
              </div>

              <div style={{ padding: '16px', backgroundColor: '#fee2e2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>⚠️ Liquidations</h5>
                <p style={{ margin: '4px 0' }}><strong>Total:</strong> {reportData.defiData.liquidations.total}</p>
                <p style={{ margin: '4px 0' }}><strong>Liquidated:</strong> ${reportData.defiData.liquidations.totalLiquidatedUSD}</p>
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fde047' }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>📈 Risk Metrics</h5>
              <p style={{ margin: '4px 0' }}><strong>Current Debt:</strong> ${reportData.defiData.metrics.currentDebtUSD}</p>
              <p style={{ margin: '4px 0' }}><strong>Health Factor:</strong> {reportData.defiData.metrics.healthFactor}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportComponent;
