import React, { useState } from 'react';
import { WalletApi } from '@concordium/browser-wallet-api-helpers';

interface SignMessageProps {
  provider: WalletApi | null;
  accountAddress: string | null;
}

const styles: { [k: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 20,
    background: '#f9fafb',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
  },
  input: {
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid #d1d5db',
    fontSize: 14,
    fontFamily: 'inherit',
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid #d1d5db',
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 100,
    resize: 'vertical',
  },
  button: {
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    background: '#2563eb',
    color: '#fff',
    transition: 'all 0.2s',
  },
  disabled: {
    background: '#d1d5db',
    color: '#6b7280',
    cursor: 'not-allowed',
  },
  resultBox: {
    padding: 12,
    borderRadius: 6,
    background: '#fff',
    border: '1px solid #e5e7eb',
    fontFamily: 'monospace',
    fontSize: 12,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    maxHeight: 300,
    overflow: 'auto',
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 4,
  },
  success: {
    color: '#059669',
    background: '#d1fae5',
    padding: 8,
    borderRadius: 6,
  },
  error: {
    color: '#dc2626',
    background: '#fee2e2',
    padding: 8,
    borderRadius: 6,
  },
};

export function SignMessage({ provider, accountAddress }: SignMessageProps): JSX.Element {
  const [message, setMessage] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignMessage = async () => {
    if (!provider || !accountAddress) {
      setStatus('Please connect your Concordium wallet first');
      return;
    }

    if (!message.trim()) {
      setStatus('Please enter a message to sign');
      return;
    }

    setLoading(true);
    setStatus('Requesting signature...');
    setSignature('');

    try {
      // Sign the message using Concordium wallet
      const signedMessage = await provider.signMessage(accountAddress, message);

      setSignature(JSON.stringify(signedMessage, null, 2));
      setStatus('Message signed successfully!');
    } catch (error: any) {
      console.error('Sign message error:', error);
      
      if (error?.message?.includes('User rejected') || error?.message?.includes('cancelled')) {
        setStatus('Signature request was cancelled');
      } else {
        setStatus(`Error: ${error?.message || String(error)}`);
      }
      setSignature('');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignature = async () => {
    if (!signature) {
      setStatus('No signature to verify');
      return;
    }

    setLoading(true);
    setStatus('Verifying signature with backend...');

    try {
      const signatureData = JSON.parse(signature);
      
      // Basic validation
      if (!signatureData.signature || !signatureData.message) {
        throw new Error('Invalid signature format');
      }

      // Send to backend for verification
      const response = await fetch('/api/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: signatureData,
          message: message,
          accountAddress: accountAddress,
        }),
      });

      const result = await response.json();

      if (response.ok && result.verified) {
        setStatus('✅ Signature verified successfully!');
      } else {
        setStatus('❌ Signature verification failed');
      }
    } catch (error: any) {
      setStatus(`Verification error: ${error?.message || String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div>
        <div style={styles.label}>Message to Sign</div>
        <textarea
          style={styles.textarea}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message here..."
          disabled={loading || !provider || !accountAddress}
        />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          style={{
            ...styles.button,
            ...(loading || !provider || !accountAddress || !message.trim() ? styles.disabled : {}),
          }}
          onClick={handleSignMessage}
          disabled={loading || !provider || !accountAddress || !message.trim()}
        >
          {loading ? 'Signing...' : 'Sign Message'}
        </button>

        {signature && (
          <button
            style={{
              ...styles.button,
              background: '#059669',
            }}
            onClick={handleVerifySignature}
            disabled={loading}
          >
            Verify Signature
          </button>
        )}
      </div>

      {status && (
        <div style={status.includes('Error') || status.includes('cancelled') ? styles.error : styles.success}>
          {status}
        </div>
      )}

      {signature && (
        <div>
          <div style={styles.label}>Signature Result</div>
          <div style={styles.resultBox}>{signature}</div>
        </div>
      )}

      <div style={{ fontSize: 12, color: '#6b7280', padding: '8px 0' }}>
        <strong>ℹ️ How it works:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
          <li>Enter any message you want to sign</li>
          <li>Click "Sign Message" to request signature from wallet</li>
          <li>Approve the request in Concordium Browser Wallet</li>
          <li>The signature proves you control the account</li>
          <li>Use the signature for authentication or verification</li>
        </ul>
      </div>
    </div>
  );
}
