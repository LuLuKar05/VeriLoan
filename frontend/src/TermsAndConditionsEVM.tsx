import React, { useState, useEffect, useRef } from 'react';
import { useSignMessage } from 'wagmi';

interface TermsAndConditionsEVMProps {
  address: string | undefined;
  onAccepted: (signature: any) => void;
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
    maxWidth: 700,
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
  checkboxContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    marginTop: 4,
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
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
  signButton: {
    backgroundColor: '#2563eb',
    color: '#fff',
  },
  signButtonDisabled: {
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
};

export function TermsAndConditionsEVM({ address, onAccepted, onCancel }: TermsAndConditionsEVMProps): JSX.Element {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
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
    handleScroll(); // Check initial state

    return () => element.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAgreeAndSign = async () => {
    if (!address) {
      alert('EVM wallet address not available');
      return;
    }

    setIsSigning(true);

    try {
      // Create terms document hash (using Web Crypto API)
      const termsText = `VeriLoan Terms and Conditions v${TERMS_VERSION}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(termsText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const termsHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Create message to sign
      const timestamp = new Date().toISOString();
      const message = `I accept the VeriLoan Terms and Conditions

Version: ${TERMS_VERSION}
Document Hash: ${termsHash}
EVM Address: ${address}
Timestamp: ${timestamp}

By signing this message, I confirm that I have read, understood, and agree to be bound by the VeriLoan Terms and Conditions.`;

      // Request signature from MetaMask
      const signature = await signMessageAsync({ message });

      // Prepare signature data
      const signatureData = {
        signature,
        message,
        termsVersion: TERMS_VERSION,
        termsHash,
        address,
        timestamp,
        walletType: 'EVM'
      };

      onAccepted(signatureData);
    } catch (error: any) {
      console.error('Signature error:', error);
      alert(`Failed to sign: ${error?.message || 'Unknown error'}`);
      setIsSigning(false);
    }
  };

  const canSign = hasScrolledToBottom && hasAgreed && !isSigning;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>🦊 MetaMask Terms & Conditions</h2>
          <p style={styles.subtitle}>Please read and accept our terms before proceeding</p>
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
              By connecting your MetaMask wallet and using the VeriLoan platform, you agree to be bound by these Terms and Conditions. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>2. EVM Wallet Requirements</h3>
            <p style={styles.paragraph}>You confirm that:</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>You are the rightful owner of the connected MetaMask wallet</li>
              <li style={styles.listItem}>You have full control over the private keys associated with this wallet</li>
              <li style={styles.listItem}>You understand the risks associated with blockchain transactions</li>
              <li style={styles.listItem}>Your wallet address will be linked to your verified identity</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>3. Identity Verification</h3>
            <p style={styles.paragraph}>
              VeriLoan uses cross-chain identity verification combining Concordium zero-knowledge proofs with EVM wallet ownership.
              By signing these terms with your MetaMask wallet, you authorize us to:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Verify your wallet ownership through cryptographic signatures</li>
              <li style={styles.listItem}>Link your EVM address with your verified Concordium identity</li>
              <li style={styles.listItem}>Store your wallet address for authentication purposes</li>
              <li style={styles.listItem}>Process your identity verification data according to our privacy policy</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>4. Data Privacy & Security</h3>
            <p style={styles.paragraph}>
              Your privacy is important to us. We commit to:
            </p>
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
              <li style={styles.listItem}>Maintaining the security of your wallet and private keys</li>
              <li style={styles.listItem}>Ensuring all provided information is accurate and truthful</li>
              <li style={styles.listItem}>Understanding the blockchain transactions you sign</li>
              <li style={styles.listItem}>Complying with all applicable laws and regulations</li>
              <li style={styles.listItem}>Reporting any suspicious activity or security breaches</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>6. Service Availability</h3>
            <p style={styles.paragraph}>
              VeriLoan is provided "as is" without warranties. We reserve the right to:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Modify, suspend, or discontinue the service at any time</li>
              <li style={styles.listItem}>Update these terms with reasonable notice to users</li>
              <li style={styles.listItem}>Refuse service to anyone for any lawful reason</li>
              <li style={styles.listItem}>Implement additional verification requirements as needed</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>7. Limitation of Liability</h3>
            <p style={styles.paragraph}>
              VeriLoan and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages
              resulting from your use of the service. This includes but is not limited to loss of funds, data, or access to your wallet.
            </p>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>8. Cryptographic Signatures</h3>
            <p style={styles.paragraph}>
              By signing this document with your MetaMask wallet, you create a legally binding cryptographic signature that:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Proves you have read and understood these terms</li>
              <li style={styles.listItem}>Confirms your agreement to be bound by these terms</li>
              <li style={styles.listItem}>Verifies your ownership of the signing wallet</li>
              <li style={styles.listItem}>Creates an immutable record of your acceptance</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>9. Contact Information</h3>
            <p style={styles.paragraph}>
              For questions or concerns regarding these terms, please contact us at support@veriloan.example.com
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
          <div style={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="agree-checkbox-evm"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              disabled={!hasScrolledToBottom}
              style={styles.checkbox}
            />
            <label htmlFor="agree-checkbox-evm" style={styles.checkboxLabel}>
              I have read and agree to the VeriLoan Terms and Conditions (Version {TERMS_VERSION})
            </label>
          </div>

          <div style={styles.buttonRow}>
            <button
              style={{ ...styles.button, ...styles.cancelButton }}
              onClick={onCancel}
              disabled={isSigning}
            >
              Cancel
            </button>
            <button
              style={{
                ...styles.button,
                ...(canSign ? styles.signButton : styles.signButtonDisabled),
              }}
              onClick={handleAgreeAndSign}
              disabled={!canSign}
            >
              {isSigning ? '⏳ Waiting for Signature...' : '🦊 Sign with MetaMask'}
            </button>
          </div>

          {address && (
            <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', fontFamily: 'monospace' }}>
              Signing as: {address}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
