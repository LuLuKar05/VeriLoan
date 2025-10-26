/**
 * Report Component
 * Generates a comprehensive user report with identity and DeFi lending data
 */

import React, { useState } from 'react';

interface ReportData {
  success: boolean;
  generatedAt: string;
  concordiumAddress: string;
  userIdentity: {
    firstName: string;
    lastName: string;
    fullName: string;
    nationality: string;
    ageVerified18Plus: boolean;
    verificationDate: string;
  };
  pairedWallets: {
    count: number;
    addresses: string[];
  };
  defiData: {
    loans: {
      total: number;
      active: number;
      inactive: number;
      totalBorrowedUSD: string;
      positions: any[];
    };
    repayments: {
      total: number;
      totalRepaidUSD: string;
      history: any[];
    };
    liquidations: {
      total: number;
      totalLiquidatedUSD: string;
      events: any[];
    };
    metrics: {
      currentDebtUSD: string;
      ltvRatio: string;
      healthFactor: string;
    };
  };
  dataSources: {
    identity: string;
    defiData: string;
    hasuraEndpoint: string;
  };
}

interface ReportComponentProps {
  concordiumAddress: string;
  backendUrl?: string;
}

export const ReportComponent: React.FC<ReportComponentProps> = ({
  concordiumAddress,
  backendUrl = 'http://localhost:8000',
}) => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      console.log('🔄 Generating report for:', concordiumAddress);

      const response = await fetch(
        `${backendUrl}/api/report/${concordiumAddress}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const data: ReportData = await response.json();
      console.log('✅ Report generated successfully:', data);
      setReportData(data);
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

───────────────────────────────────────────────────────────
USER IDENTITY (Verified via Concordium ZKP)
───────────────────────────────────────────────────────────

Name: ${reportData.userIdentity.fullName}
First Name: ${reportData.userIdentity.firstName}
Last Name: ${reportData.userIdentity.lastName}
Country: ${reportData.userIdentity.nationality}
Age 18+: ${reportData.userIdentity.ageVerified18Plus ? 'YES ✓' : 'NO ✗'}
Verification Date: ${new Date(reportData.userIdentity.verificationDate).toLocaleString()}

───────────────────────────────────────────────────────────
PAIRED WALLETS
───────────────────────────────────────────────────────────

Total EVM Addresses: ${reportData.pairedWallets.count}

${reportData.pairedWallets.addresses.map((addr, idx) => `${idx + 1}. ${addr}`).join('\n')}

───────────────────────────────────────────────────────────
DEFI LENDING DATA (from Hasura GraphQL)
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
  • LTV Ratio: ${reportData.defiData.metrics.ltvRatio}
  • Health Factor: ${reportData.defiData.metrics.healthFactor}

───────────────────────────────────────────────────────────
DATA SOURCES
───────────────────────────────────────────────────────────

Identity: ${reportData.dataSources.identity}
DeFi Data: ${reportData.dataSources.defiData}
Hasura Endpoint: ${reportData.dataSources.hasuraEndpoint}

═══════════════════════════════════════════════════════════
END OF REPORT
═══════════════════════════════════════════════════════════
`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veriloan-report-${concordiumAddress.substring(0, 8)}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h2>📊 Generate User Report</h2>
      <p>
        This will generate a comprehensive report including user identity and
        DeFi lending data from Hasura GraphQL.
      </p>

      <div style={{ marginBottom: '20px' }}>
        <p>
          <strong>Concordium Address:</strong> {concordiumAddress}
        </p>
        <button
          onClick={generateReport}
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px',
          }}
        >
          {loading ? '⏳ Generating...' : '📊 Generate Report'}
        </button>

        {reportData && (
          <button
            onClick={downloadReport}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            💾 Download Report
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: '15px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {reportData && (
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#f9f9f9',
          }}
        >
          <h3>✅ Report Generated Successfully</h3>
          <p style={{ fontSize: '12px', color: '#666' }}>
            Generated at: {new Date(reportData.generatedAt).toLocaleString()}
          </p>

          {/* User Identity Section */}
          <div style={{ marginBottom: '30px' }}>
            <h4>👤 User Identity</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Name:</td>
                  <td style={{ padding: '8px' }}>
                    {reportData.userIdentity.fullName}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>
                    Country:
                  </td>
                  <td style={{ padding: '8px' }}>
                    {reportData.userIdentity.nationality}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>
                    Age 18+:
                  </td>
                  <td style={{ padding: '8px' }}>
                    {reportData.userIdentity.ageVerified18Plus ? (
                      <span style={{ color: 'green' }}>✓ YES</span>
                    ) : (
                      <span style={{ color: 'red' }}>✗ NO</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Paired Wallets Section */}
          <div style={{ marginBottom: '30px' }}>
            <h4>🔗 Paired EVM Wallets ({reportData.pairedWallets.count})</h4>
            <ul>
              {reportData.pairedWallets.addresses.map((addr, idx) => (
                <li key={idx} style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                  {addr}
                </li>
              ))}
            </ul>
          </div>

          {/* DeFi Data Section */}
          <div>
            <h4>💰 DeFi Lending Data (from Hasura GraphQL)</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
                <h5>📊 Loans</h5>
                <p><strong>Total:</strong> {reportData.defiData.loans.total}</p>
                <p><strong>Active:</strong> {reportData.defiData.loans.active}</p>
                <p><strong>Borrowed:</strong> ${reportData.defiData.loans.totalBorrowedUSD}</p>
              </div>

              <div style={{ padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
                <h5>💳 Repayments</h5>
                <p><strong>Total:</strong> {reportData.defiData.repayments.total}</p>
                <p><strong>Repaid:</strong> ${reportData.defiData.repayments.totalRepaidUSD}</p>
              </div>

              <div style={{ padding: '15px', backgroundColor: '#ffebee', borderRadius: '8px' }}>
                <h5>⚠️ Liquidations</h5>
                <p><strong>Total:</strong> {reportData.defiData.liquidations.total}</p>
                <p><strong>Liquidated:</strong> ${reportData.defiData.liquidations.totalLiquidatedUSD}</p>
              </div>
            </div>

            <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
              <h5>📈 Risk Metrics</h5>
              <p><strong>Current Debt:</strong> ${reportData.defiData.metrics.currentDebtUSD}</p>
              <p><strong>LTV Ratio:</strong> {reportData.defiData.metrics.ltvRatio}</p>
              <p><strong>Health Factor:</strong> {reportData.defiData.metrics.healthFactor}</p>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>
            <p><strong>Data Sources:</strong></p>
            <p>• Identity: {reportData.dataSources.identity}</p>
            <p>• DeFi Data: {reportData.dataSources.defiData}</p>
            <p>• Hasura: {reportData.dataSources.hasuraEndpoint}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportComponent;
