import React, { useState, useEffect, useRef } from 'react';
import { useSignMessage } from 'wagmi';
import { WalletApi } from '@concordium/browser-wallet-api-helpers';

interface TermsAndConditionsCombinedProps {
  concordiumProvider: WalletApi | null;
  concordiumAddress: string | null;
  evmAddress: string | undefined;
  onBothAccepted: (concordiumSig: any, evmSig: any) => void;
  onCancel: () => void;
}

const TERMS_VERSION = '1.0';

const styles: { [k: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxWidth: 800,
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  header: {
    padding: '24px 24px 16px',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: '#111827',
  },
  subtitle: {
    margin: '8px 0 0',
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 12,
    color: '#111827',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 1.6,
    color: '#374151',
    marginBottom: 12,
  },
  list: {
    paddingLeft: 20,
    marginBottom: 12,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 1.6,
    color: '#374151',
    marginBottom: 8,
  },
  footer: {
    padding: 24,
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  signatureSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
  },
  signatureRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  signButton: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signButtonPrimary: {
    backgroundColor: '#2563eb',
    color: '#fff',
  },
  signButtonSuccess: {
    backgroundColor: '#10b981',
    color: '#fff',
  },
  signButtonDisabled: {
    backgroundColor: '#d1d5db',
    color: '#6b7280',
    cursor: 'not-allowed',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusVerifying: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  statusSuccess: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusError: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    border: '2px solid #3b82f6',
  },
  checkbox: {
    marginTop: 4,
    cursor: 'pointer',
    width: 18,
    height: 18,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: 600,
    cursor: 'pointer',
    userSelect: 'none',
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: '12px 20px',
    borderRadius: 8,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    color: '#111827',
  },
  agreeButton: {
    backgroundColor: '#2563eb',
    color: '#fff',
  },
  agreeButtonDisabled: {
    backgroundColor: '#d1d5db',
    color: '#6b7280',
    cursor: 'not-allowed',
  },
  scrollIndicator: {
    padding: '12px',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    fontSize: 13,
    color: '#92400e',
    textAlign: 'center',
    marginBottom: 12,
  },
  addressText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#6b7280',
  },
};

export function TermsAndConditionsCombined({
  concordiumProvider,
  concordiumAddress,
  evmAddress,
  onBothAccepted,
  onCancel,
}: TermsAndConditionsCombinedProps): JSX.Element {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Concordium signature state
  const [concordiumStatus, setConcordiumStatus] = useState<'pending' | 'signing' | 'verifying' | 'success' | 'error'>('pending');
  const [concordiumSignature, setConcordiumSignature] = useState<any>(null);
  const [concordiumError, setConcordiumError] = useState<string>('');

  // EVM signature state
  const [evmStatus, setEvmStatus] = useState<'pending' | 'signing' | 'verifying' | 'success' | 'error'>('pending');
  const [evmSignature, setEvmSignature] = useState<any>(null);
  const [evmError, setEvmError] = useState<string>('');

  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      if (isAtBottom) {
        setHasScrolledToBottom(true);
      }
    };

    element.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => element.removeEventListener('scroll', handleScroll);
  }, []);

  const handleConcordiumSign = async () => {
    if (!concordiumProvider || !concordiumAddress) {
      setConcordiumError('Concordium wallet not connected');
      setConcordiumStatus('error');
      return;
    }

    setConcordiumStatus('signing');
    setConcordiumError('');

    try {
      // Create terms document hash
      const termsText = `VeriLoan Terms and Conditions v${TERMS_VERSION}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(termsText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const termsHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const timestamp = new Date().toISOString();
      const message = `I accept the VeriLoan Terms and Conditions

Version: ${TERMS_VERSION}
Document Hash: ${termsHash}
Concordium Account: ${concordiumAddress}
Timestamp: ${timestamp}

By signing this message, I confirm that I have read, understood, and agree to be bound by the VeriLoan Terms and Conditions.`;

      // Sign with Concordium wallet
      const signature = await concordiumProvider.signMessage(concordiumAddress, message);

      const signatureData = {
        signature,
        message,
        termsVersion: TERMS_VERSION,
        termsHash,
        accountAddress: concordiumAddress,
        timestamp,
        walletType: 'Concordium'
      };

      // Verify with backend
      setConcordiumStatus('verifying');
      const response = await fetch('/api/verify-terms-acceptance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signatureData),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.verified) {
        throw new Error(result.error || 'Verification failed');
      }

      setConcordiumSignature(signatureData);
      setConcordiumStatus('success');

    } catch (error: any) {
      console.error('Concordium signature error:', error);
      setConcordiumError(error?.message || 'Failed to sign');
      setConcordiumStatus('error');
    }
  };

  const handleEvmSign = async () => {
    if (!evmAddress) {
      setEvmError('EVM wallet not connected');
      setEvmStatus('error');
      return;
    }

    setEvmStatus('signing');
    setEvmError('');

    try {
      // Create terms document hash
      const termsText = `VeriLoan Terms and Conditions v${TERMS_VERSION}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(termsText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const termsHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const timestamp = new Date().toISOString();
      const message = `I accept the VeriLoan Terms and Conditions

Version: ${TERMS_VERSION}
Document Hash: ${termsHash}
EVM Address: ${evmAddress}
Timestamp: ${timestamp}

By signing this message, I confirm that I have read, understood, and agree to be bound by the VeriLoan Terms and Conditions.`;

      // Sign with MetaMask
      const signature = await signMessageAsync({ message });

      const signatureData = {
        signature,
        message,
        termsVersion: TERMS_VERSION,
        termsHash,
        address: evmAddress,
        timestamp,
        walletType: 'EVM'
      };

      // Verify with backend
      setEvmStatus('verifying');
      const response = await fetch('/api/verify-evm-terms-acceptance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signatureData),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.verified) {
        throw new Error(result.error || 'Verification failed');
      }

      setEvmSignature(signatureData);
      setEvmStatus('success');

    } catch (error: any) {
      console.error('EVM signature error:', error);
      setEvmError(error?.message || 'Failed to sign');
      setEvmStatus('error');
    }
  };

  const bothSignaturesVerified = concordiumStatus === 'success' && evmStatus === 'success';
  const canAgree = hasScrolledToBottom && bothSignaturesVerified && hasAgreed;

  const handleAgree = () => {
    if (canAgree && concordiumSignature && evmSignature) {
      onBothAccepted(concordiumSignature, evmSignature);
    }
  };

  const getStatusBadge = (status: string, error: string) => {
    switch (status) {
      case 'pending':
        return <span style={{ ...styles.statusBadge, ...styles.statusPending }}>⏸️ Pending</span>;
      case 'signing':
        return <span style={{ ...styles.statusBadge, ...styles.statusVerifying }}>✍️ Signing...</span>;
      case 'verifying':
        return <span style={{ ...styles.statusBadge, ...styles.statusVerifying }}>🔄 Verifying...</span>;
      case 'success':
        return <span style={{ ...styles.statusBadge, ...styles.statusSuccess }}>✅ Verified</span>;
      case 'error':
        return <span style={{ ...styles.statusBadge, ...styles.statusError }}>❌ {error || 'Error'}</span>;
      default:
        return null;
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>📜 Terms & Conditions</h2>
          <p style={styles.subtitle}>Please read, sign with both wallets, and accept our terms</p>
        </div>

        <div style={styles.content} ref={contentRef}>
          {!hasScrolledToBottom && (
            <div style={styles.scrollIndicator}>
              ⚠️ Please scroll to the bottom to read all terms
            </div>
          )}

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>1. Acceptance of Terms</h3>
            <p style={styles.paragraph}>
              By connecting your wallets and using the VeriLoan platform, you agree to be bound by these Terms and Conditions.
              If you do not agree to these terms, please do not use our service.
            </p>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>2. Wallet Requirements</h3>
            <p style={styles.paragraph}>You must sign these terms with both wallets:</p>
            <ul style={styles.list}>
              <li style={styles.listItem}><strong>Concordium Wallet:</strong> For zero-knowledge proof identity verification</li>
              <li style={styles.listItem}><strong>EVM Wallet (MetaMask):</strong> For cross-chain address linking</li>
              <li style={styles.listItem}>You confirm rightful ownership of both wallets</li>
              <li style={styles.listItem}>You have full control over the private keys</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>3. Identity Verification</h3>
            <p style={styles.paragraph}>
              VeriLoan uses cross-chain identity verification combining Concordium zero-knowledge proofs with EVM wallet ownership.
              By signing these terms, you authorize us to:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Verify your wallet ownership through cryptographic signatures</li>
              <li style={styles.listItem}>Link your EVM address with your verified Concordium identity</li>
              <li style={styles.listItem}>Store your wallet addresses for authentication purposes</li>
              <li style={styles.listItem}>Process your identity verification data according to our privacy policy</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>4. Data Privacy & Security</h3>
            <p style={styles.paragraph}>Your privacy is important to us. We commit to:</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Protect your personal information using industry-standard security measures</li>
              <li style={styles.listItem}>Never share your private keys or wallet credentials</li>
              <li style={styles.listItem}>Use zero-knowledge proofs to minimize data exposure</li>
              <li style={styles.listItem}>Comply with applicable data protection regulations (GDPR, CCPA)</li>
              <li style={styles.listItem}>Store only necessary information for verification purposes</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>5. User Responsibilities</h3>
            <p style={styles.paragraph}>You are responsible for:</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Maintaining the security of your wallets and private keys</li>
              <li style={styles.listItem}>Ensuring all provided information is accurate and truthful</li>
              <li style={styles.listItem}>Understanding the blockchain transactions you sign</li>
              <li style={styles.listItem}>Complying with all applicable laws and regulations</li>
              <li style={styles.listItem}>Reporting any suspicious activity or security breaches</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>6. Cryptographic Signatures</h3>
            <p style={styles.paragraph}>
              By signing this document with both your Concordium and EVM wallets, you create legally binding cryptographic signatures that:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Prove you have read and understood these terms</li>
              <li style={styles.listItem}>Confirm your agreement to be bound by these terms</li>
              <li style={styles.listItem}>Verify your ownership of both wallets</li>
              <li style={styles.listItem}>Create an immutable record of your acceptance</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>7. Limitation of Liability</h3>
            <p style={styles.paragraph}>
              VeriLoan and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages
              resulting from your use of the service.
            </p>
          </div>

          <div style={styles.section}>
            <p style={styles.paragraph}>
              <strong>Last Updated:</strong> October 25, 2025<br />
              <strong>Version:</strong> {TERMS_VERSION}
            </p>
          </div>
        </div>

        <div style={styles.footer}>
          {/* Signature Section */}
          <div style={styles.signatureSection}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Step 1: Sign with both wallets to verify ownership
            </div>

            {/* Concordium Signature */}
            <div style={styles.signatureRow}>
              <button
                style={{
                  ...styles.signButton,
                  ...(concordiumStatus === 'success' ? styles.signButtonSuccess : 
                      concordiumStatus === 'pending' && hasScrolledToBottom ? styles.signButtonPrimary : 
                      styles.signButtonDisabled),
                }}
                onClick={handleConcordiumSign}
                disabled={!hasScrolledToBottom || concordiumStatus === 'signing' || concordiumStatus === 'verifying' || concordiumStatus === 'success'}
              >
                {concordiumStatus === 'success' ? '✅ Signed with Concordium' : '🔐 Sign with Concordium'}
              </button>
              {getStatusBadge(concordiumStatus, concordiumError)}
            </div>
            {concordiumAddress && (
              <div style={{ ...styles.addressText, marginLeft: 4 }}>
                Account: {concordiumAddress}
              </div>
            )}

            {/* EVM Signature */}
            <div style={styles.signatureRow}>
              <button
                style={{
                  ...styles.signButton,
                  ...(evmStatus === 'success' ? styles.signButtonSuccess : 
                      evmStatus === 'pending' && hasScrolledToBottom ? styles.signButtonPrimary : 
                      styles.signButtonDisabled),
                }}
                onClick={handleEvmSign}
                disabled={!hasScrolledToBottom || evmStatus === 'signing' || evmStatus === 'verifying' || evmStatus === 'success'}
              >
                {evmStatus === 'success' ? '✅ Signed with MetaMask' : '🦊 Sign with MetaMask'}
              </button>
              {getStatusBadge(evmStatus, evmError)}
            </div>
            {evmAddress && (
              <div style={{ ...styles.addressText, marginLeft: 4 }}>
                Address: {evmAddress}
              </div>
            )}
          </div>

          {/* Agreement Checkbox - Only shown after both signatures verified */}
          {bothSignaturesVerified && (
            <div style={styles.checkboxContainer}>
              <input
                type="checkbox"
                id="agree-checkbox"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                style={styles.checkbox}
              />
              <label htmlFor="agree-checkbox" style={styles.checkboxLabel}>
                ✅ Both signatures verified! I have read and agree to the VeriLoan Terms and Conditions (Version {TERMS_VERSION})
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div style={styles.buttonRow}>
            <button
              style={{ ...styles.button, ...styles.cancelButton }}
              onClick={onCancel}
              disabled={concordiumStatus === 'signing' || concordiumStatus === 'verifying' || evmStatus === 'signing' || evmStatus === 'verifying'}
            >
              Cancel
            </button>
            <button
              style={{
                ...styles.button,
                ...(canAgree ? styles.agreeButton : styles.agreeButtonDisabled),
              }}
              onClick={handleAgree}
              disabled={!canAgree}
            >
              {bothSignaturesVerified ? 'Proceed to Verification' : 'Sign Both Wallets First'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
