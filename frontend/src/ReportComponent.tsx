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
  const [showModal, setShowModal] = useState(false);

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
      setShowModal(true); // Open modal when report is ready
    } catch (err: any) {
      console.error('❌ Report generation failed:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
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
    <>
      <div style={{ width: '100%' }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 600, color: '#59ff00', textAlign: 'center' }}>📊 Generate User Report</h2>
        <p style={{ margin: '0 0 20px 0', color: '#9ca3af', fontSize: 15, textAlign: 'center' }}>
          Generate a comprehensive report with identity and DeFi lending data
        </p>

        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <button
            onClick={generateReport}
            disabled={loading}
            style={{
              padding: '12px 24px',
              fontSize: 15,
              backgroundColor: loading ? '#555D58' : '#59ff00',
              color: loading ? '#9ca3af' : '#1a1c1b',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
              width: '100%',
              maxWidth: 320,
              opacity: loading ? 0.6 : 1,
              boxShadow: loading ? 'none' : '0 0 20px rgba(89, 255, 0, 0.3)',
            }}
          >
            {loading ? '⏳ Generating...' : '📊 Generate Report'}
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '15px',
              backgroundColor: 'rgba(255, 0, 0, 0.15)',
              color: '#ff4444',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: 14,
            }}
          >
            <strong>❌ Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Modal Popup for Report */}
      {showModal && reportData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: '#2a2c2b',
              borderRadius: 12,
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(89, 255, 0, 0.3)',
              border: '1px solid rgba(89, 255, 0, 0.3)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ 
              padding: '20px 24px', 
              borderBottom: '1px solid rgba(89, 255, 0, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              backgroundColor: '#2a2c2b',
              zIndex: 10,
            }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#111827' }}>
                � User Report
              </h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button
                  onClick={downloadReport}
                  style={{
                    padding: '8px 16px',
                    fontSize: 14,
                    backgroundColor: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  💾 Download
                </button>
                <button
                  onClick={closeModal}
                  style={{
                    padding: '8px 12px',
                    fontSize: 20,
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '6px',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24, textAlign: 'center' }}>
                Generated at: {new Date(reportData.generatedAt).toLocaleString()}
              </p>

              {/* User Identity Section */}
              <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#1f2120', borderRadius: 8, border: '1px solid rgba(89, 255, 0, 0.2)' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#59ff00' }}>👤 User Identity</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#9ca3af', fontSize: 14 }}>Name:</td>
                      <td style={{ padding: '8px 12px', fontSize: 14, color: '#e5e7eb' }}>
                        {reportData.userIdentity.fullName}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#9ca3af', fontSize: 14 }}>
                        Country:
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 14, color: '#e5e7eb' }}>
                        {reportData.userIdentity.nationality}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#9ca3af', fontSize: 14 }}>
                        Age 18+:
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 14, color: '#e5e7eb' }}>
                        {reportData.userIdentity.ageVerified18Plus ? (
                          <span style={{ color: '#59ff00', fontWeight: 600 }}>✓ YES</span>
                        ) : (
                          <span style={{ color: '#ff4444', fontWeight: 600 }}>✗ NO</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Paired Wallets Section */}
              <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#1f2120', borderRadius: 8, border: '1px solid rgba(89, 255, 0, 0.2)' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#59ff00' }}>
                  🔗 Paired EVM Wallets ({reportData.pairedWallets.count})
                </h4>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {reportData.pairedWallets.addresses.map((addr, idx) => (
                    <li key={idx} style={{ fontFamily: 'monospace', fontSize: '13px', color: '#9ca3af', marginBottom: 8 }}>
                      {addr}
                    </li>
                  ))}
                </ul>
              </div>

              {/* DeFi Data Section */}
              <div>
                <h4 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#59ff00' }}>
                  💰 DeFi Lending Data
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div style={{ padding: '16px', backgroundColor: '#1f2120', borderRadius: '8px', border: '1px solid rgba(89, 255, 0, 0.3)' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#59ff00' }}>📊 Loans</h5>
                    <p style={{ margin: '4px 0', fontSize: 13, color: '#e5e7eb' }}><strong>Total:</strong> {reportData.defiData.loans.total}</p>
                    <p style={{ margin: '4px 0', fontSize: 13, color: '#e5e7eb' }}><strong>Active:</strong> {reportData.defiData.loans.active}</p>
                    <p style={{ margin: '4px 0', fontSize: 13, color: '#e5e7eb' }}><strong>Borrowed:</strong> ${reportData.defiData.loans.totalBorrowedUSD}</p>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: '#1f2120', borderRadius: '8px', border: '1px solid rgba(89, 255, 0, 0.3)' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#59ff00' }}>💳 Repayments</h5>
                    <p style={{ margin: '4px 0', fontSize: 13, color: '#e5e7eb' }}><strong>Total:</strong> {reportData.defiData.repayments.total}</p>
                    <p style={{ margin: '4px 0', fontSize: 13, color: '#e5e7eb' }}><strong>Repaid:</strong> ${reportData.defiData.repayments.totalRepaidUSD}</p>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: '#1f2120', borderRadius: '8px', border: '1px solid rgba(255, 68, 68, 0.3)' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#ff4444' }}>⚠️ Liquidations</h5>
                    <p style={{ margin: '4px 0', fontSize: 13, color: '#e5e7eb' }}><strong>Total:</strong> {reportData.defiData.liquidations.total}</p>
                    <p style={{ margin: '4px 0', fontSize: 13, color: '#e5e7eb' }}><strong>Liquidated:</strong> ${reportData.defiData.liquidations.totalLiquidatedUSD}</p>
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#1f2120', borderRadius: '8px', border: '1px solid rgba(89, 255, 0, 0.3)' }}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#59ff00' }}>📈 Risk Metrics</h5>
                  <p style={{ margin: '4px 0', fontSize: 13, color: '#e5e7eb' }}><strong>Current Debt:</strong> ${reportData.defiData.metrics.currentDebtUSD}</p>
                  <p style={{ margin: '4px 0', fontSize: 13, color: '#e5e7eb' }}><strong>LTV Ratio:</strong> {reportData.defiData.metrics.ltvRatio}</p>
                  <p style={{ margin: '4px 0', fontSize: 13, color: '#e5e7eb' }}><strong>Health Factor:</strong> {reportData.defiData.metrics.healthFactor}</p>
                </div>
              </div>

              <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#1f2120', borderRadius: '8px', fontSize: 13, border: '1px solid rgba(89, 255, 0, 0.2)' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#59ff00' }}>Data Sources:</p>
                <p style={{ margin: '4px 0', color: '#9ca3af' }}>• Identity: {reportData.dataSources.identity}</p>
                <p style={{ margin: '4px 0', color: '#9ca3af' }}>• DeFi Data: {reportData.dataSources.defiData}</p>
                <p style={{ margin: '4px 0', color: '#9ca3af' }}>• Hasura: {reportData.dataSources.hasuraEndpoint}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportComponent;
