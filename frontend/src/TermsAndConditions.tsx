import React, { useState, useRef, useEffect } from 'react';
import { WalletApi } from '@concordium/browser-wallet-api-helpers';

interface TermsAndConditionsProps {
  provider: WalletApi | null;
  accountAddress: string | null;
  onAccepted: (signature: any) => void;
  onCancel: () => void;
}

const TERMS_VERSION = '1.0';

// SHA256 hash of the terms content (in production, compute this properly)
const TERMS_HASH = 'sha256:a1b2c3d4e5f6789012345678901234567890abcdefabcdefabcdefabcdef1234';

const styles: { [k: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 20,
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
    padding: '20px 24px',
    borderBottom: '2px solid #e5e7eb',
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: '#111827',
  },
  subtitle: {
    margin: '8px 0 0 0',
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
    lineHeight: 1.6,
    fontSize: 14,
    color: '#374151',
  },
  scrollIndicator: {
    padding: '12px 24px',
    background: '#fef3c7',
    borderTop: '1px solid #fbbf24',
    borderBottom: '1px solid #fbbf24',
    color: '#92400e',
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'center',
  },
  footer: {
    padding: '20px 24px',
    borderTop: '2px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    cursor: 'pointer',
  },
  checkbox: {
    marginTop: 2,
    width: 18,
    height: 18,
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    cursor: 'pointer',
    userSelect: 'none',
  },
  buttons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
  },
  button: {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    transition: 'all 0.2s',
  },
  cancelButton: {
    background: '#e5e7eb',
    color: '#374151',
  },
  agreeButton: {
    background: '#2563eb',
    color: '#fff',
  },
  disabledButton: {
    background: '#d1d5db',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 12,
  },
  paragraph: {
    marginBottom: 12,
  },
  list: {
    marginLeft: 20,
    marginBottom: 12,
  },
};

export function TermsAndConditions({ provider, accountAddress, onAccepted, onCancel }: TermsAndConditionsProps): JSX.Element {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        if (isAtBottom && !hasScrolledToBottom) {
          setHasScrolledToBottom(true);
        }
      }
    };

    const content = contentRef.current;
    if (content) {
      content.addEventListener('scroll', handleScroll);
      return () => content.removeEventListener('scroll', handleScroll);
    }
  }, [hasScrolledToBottom]);

  const handleAgreeAndSign = async () => {
    if (!provider || !accountAddress) {
      setError('Wallet not connected');
      return;
    }

    setIsSigning(true);
    setError('');

    try {
      const timestamp = new Date().toISOString();
      const message = `I agree to VeriLoan Terms and Conditions version ${TERMS_VERSION} (${TERMS_HASH}) on ${timestamp}`;

      const signature = await provider.signMessage(accountAddress, message);

      const signatureData = {
        signature,
        message,
        termsVersion: TERMS_VERSION,
        termsHash: TERMS_HASH,
        accountAddress,
        timestamp,
      };

      onAccepted(signatureData);
    } catch (err: any) {
      console.error('Terms signature error:', err);
      if (err?.message?.includes('User rejected') || err?.message?.includes('cancelled')) {
        setError('Signature request was cancelled. You must accept terms to continue.');
      } else {
        setError(`Error: ${err?.message || String(err)}`);
      }
    } finally {
      setIsSigning(false);
    }
  };

  const canSign = hasScrolledToBottom && hasAgreed && !isSigning;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Terms and Conditions</h2>
          <p style={styles.subtitle}>VeriLoan Identity Verification Service - Version {TERMS_VERSION}</p>
        </div>

        {!hasScrolledToBottom && (
          <div style={styles.scrollIndicator}>
            ⚠️ Please scroll down to read all terms before accepting
          </div>
        )}

        <div ref={contentRef} style={styles.content}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>1. Introduction and Acceptance</h3>
            <p style={styles.paragraph}>
              Welcome to VeriLoan ("Service", "we", "us", or "our"). These Terms and Conditions ("Terms") govern your use of the VeriLoan cross-chain identity verification service. By clicking "I Agree and Sign" below and providing your cryptographic signature, you acknowledge that you have read, understood, and agree to be bound by these Terms.
            </p>
            <p style={styles.paragraph}>
              Your digital signature using your Concordium wallet constitutes a legally binding acceptance of these Terms. This signature provides cryptographic proof of your agreement and cannot be repudiated.
            </p>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>2. Service Description</h3>
            <p style={styles.paragraph}>
              VeriLoan provides a decentralized identity verification service that enables users to:
            </p>
            <ul style={styles.list}>
              <li>Verify their identity using Concordium blockchain's Zero-Knowledge Proof (ZKP) technology</li>
              <li>Link their Concordium identity with Ethereum Virtual Machine (EVM) compatible wallet addresses</li>
              <li>Receive cross-chain attestations of their verified identity attributes</li>
              <li>Maintain privacy while proving specific identity criteria (age, nationality, etc.)</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>3. Zero-Knowledge Proof Verification</h3>
            <p style={styles.paragraph}>
              By using our Service, you understand and agree that:
            </p>
            <ul style={styles.list}>
              <li>You will be asked to provide Zero-Knowledge Proofs from your Concordium identity credentials</li>
              <li>These proofs may reveal certain attributes such as your first name, last name, age verification, and nationality</li>
              <li>The ZKP technology allows verification without exposing your complete identity credentials</li>
              <li>You must have a valid Concordium Browser Wallet with verified credentials issued by an approved identity provider</li>
              <li>The accuracy of verified information depends on the credentials issued by your identity provider</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>4. Data Collection and Usage</h3>
            <p style={styles.paragraph}>
              We collect and process the following information:
            </p>
            <ul style={styles.list}>
              <li><strong>Concordium Account Address:</strong> Your public Concordium wallet address</li>
              <li><strong>EVM Wallet Address:</strong> Your Ethereum-compatible wallet address</li>
              <li><strong>Revealed Identity Attributes:</strong> Only the attributes you choose to reveal through ZKP (e.g., age verification, nationality)</li>
              <li><strong>Cryptographic Signatures:</strong> Digital signatures from both your Concordium and EVM wallets</li>
              <li><strong>Unique User Identifier:</strong> A dApp-specific identifier derived from your Concordium credentials</li>
              <li><strong>Verification Timestamps:</strong> Time and date of verification requests</li>
            </ul>
            <p style={styles.paragraph}>
              This information is used solely for:
            </p>
            <ul style={styles.list}>
              <li>Verifying your identity and credentials</li>
              <li>Creating cross-chain attestations</li>
              <li>Maintaining service security and preventing fraud</li>
              <li>Complying with applicable legal and regulatory requirements</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>5. Privacy and Data Protection</h3>
            <p style={styles.paragraph}>
              We are committed to protecting your privacy:
            </p>
            <ul style={styles.list}>
              <li>We implement Zero-Knowledge Proof technology to minimize data exposure</li>
              <li>Your private keys never leave your wallet and are never transmitted to our servers</li>
              <li>We do not store your complete identity credentials</li>
              <li>Verification data is processed in accordance with GDPR and applicable data protection laws</li>
              <li>You have the right to request deletion of your data (where legally permissible)</li>
              <li>We do not sell or share your personal information with third parties for marketing purposes</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>6. User Responsibilities</h3>
            <p style={styles.paragraph}>
              You agree to:
            </p>
            <ul style={styles.list}>
              <li>Provide accurate and truthful information</li>
              <li>Maintain the security of your wallet private keys</li>
              <li>Use the Service only for lawful purposes</li>
              <li>Not attempt to circumvent, manipulate, or interfere with the verification process</li>
              <li>Not use the Service to create false or fraudulent identity claims</li>
              <li>Immediately notify us of any unauthorized use of your account or security breach</li>
              <li>Comply with all applicable laws and regulations in your jurisdiction</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>7. Cross-Chain Attestations</h3>
            <p style={styles.paragraph}>
              Our Service creates attestations linking your verified Concordium identity with your EVM wallet address. You understand that:
            </p>
            <ul style={styles.list}>
              <li>Attestations may be recorded on blockchain networks and cannot be easily deleted</li>
              <li>Attestations are publicly visible and verifiable by third parties</li>
              <li>You are responsible for understanding the implications of creating public attestations</li>
              <li>We do not guarantee the acceptance or recognition of attestations by third-party services</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>8. Limitations of Liability</h3>
            <p style={styles.paragraph}>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul style={styles.list}>
              <li>The Service is provided "AS IS" without warranties of any kind</li>
              <li>We do not guarantee continuous, uninterrupted, or error-free operation</li>
              <li>We are not liable for any indirect, incidental, special, or consequential damages</li>
              <li>Our total liability shall not exceed the fees paid by you (if any) for the Service</li>
              <li>We are not responsible for the security of your private keys or wallet software</li>
              <li>We are not liable for losses resulting from blockchain network failures or issues</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>9. Intellectual Property</h3>
            <p style={styles.paragraph}>
              All content, features, and functionality of the Service are owned by VeriLoan and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>10. Modifications to Terms</h3>
            <p style={styles.paragraph}>
              We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Service after changes constitutes acceptance of the modified Terms. Material changes will require you to re-sign the updated Terms.
            </p>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>11. Termination</h3>
            <p style={styles.paragraph}>
              We reserve the right to terminate or suspend your access to the Service at any time, with or without cause, with or without notice. Upon termination, your right to use the Service will immediately cease.
            </p>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>12. Governing Law and Dispute Resolution</h3>
            <p style={styles.paragraph}>
              These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in accordance with the rules of [Arbitration Body].
            </p>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>13. Contact Information</h3>
            <p style={styles.paragraph}>
              For questions about these Terms or the Service, please contact us at: support@veriloan.example
            </p>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>14. Entire Agreement</h3>
            <p style={styles.paragraph}>
              These Terms constitute the entire agreement between you and VeriLoan regarding the Service and supersede all prior agreements and understandings.
            </p>
          </div>

          <div style={{ marginTop: 32, padding: 16, background: '#f3f4f6', borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
              <strong>Last Updated:</strong> October 25, 2025<br />
              <strong>Version:</strong> {TERMS_VERSION}<br />
              <strong>Document Hash:</strong> {TERMS_HASH}
            </p>
          </div>
        </div>

        <div style={styles.footer}>
          {error && (
            <div style={{ padding: 12, background: '#fee2e2', color: '#dc2626', borderRadius: 6, fontSize: 13 }}>
              {error}
            </div>
          )}

          <label style={styles.checkboxContainer}>
            <input
              type="checkbox"
              style={styles.checkbox}
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              disabled={!hasScrolledToBottom || isSigning}
            />
            <span style={styles.checkboxLabel}>
              I have read, understood, and agree to be bound by these Terms and Conditions. I understand that my digital signature will constitute legally binding acceptance.
            </span>
          </label>

          <div style={styles.buttons}>
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
                ...(canSign ? styles.agreeButton : styles.disabledButton),
              }}
              onClick={handleAgreeAndSign}
              disabled={!canSign}
            >
              {isSigning ? 'Signing...' : 'I Agree and Sign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
