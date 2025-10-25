import React, { useState } from 'react';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { mainnet } from 'wagmi/chains';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { useAccount, useConnect, useSignMessage } from 'wagmi';

// Helper: calculates date string for 18 years ago (YYYY-MM-DD)
export function getEighteenYearsAgoDate(): string {
  const now = new Date();
  const year = now.getUTCFullYear() - 18;
  const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = now.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Wagmi config setup (basic public provider; adjust chains/providers as needed)
const { chains, publicClient } = configureChains([mainnet], [publicProvider()]);

const wagmiConfig = createConfig({
  autoConnect: false,
  connectors: [new MetaMaskConnector({ chains }), new InjectedConnector({ chains })],
  publicClient,
});

const styles: { [k: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: '100vh',
    padding: '40px 16px',
    fontFamily: 'Inter, Arial, sans-serif',
    background: '#f7f8fb',
    color: '#111827',
  },
  card: {
    width: '100%',
    maxWidth: 720,
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  header: { textAlign: 'center' },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 13, color: '#6b7280', fontWeight: 600 },
  button: {
    padding: '10px 14px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  primary: { background: '#2563eb', color: '#fff' },
  secondary: { background: '#e5e7eb', color: '#111827' },
  disabled: { background: '#d1d5db', color: '#6b7280', cursor: 'not-allowed' },
  statusBox: {
    width: '100%',
    minHeight: 80,
    padding: 12,
    borderRadius: 8,
    border: '1px solid #e6e9ef',
    background: '#fbfdff',
    fontFamily: 'monospace',
    fontSize: 13,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
  },
  row: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  addressText: { fontFamily: 'monospace', fontSize: 12, color: '#6b7280' },
};

function VerificationDApp(): JSX.Element {
  // Concordium state (simplified for now)
  const [concordiumAddress, setConcordiumAddress] = useState<string | null>(null);

  // EVM (wagmi)
  const { connect: connectEvm, connectors } = useConnect();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [status, setStatus] = useState<string>('Ready to verify');
  const [loading, setLoading] = useState<boolean>(false);

  const onConnectConcordium = async () => {
    try {
      // For now, this is a placeholder
      // You'll need to implement actual Concordium wallet connection
      setStatus('Concordium wallet connection requires the Concordium Browser Wallet extension...');
      
      // Placeholder - in reality, you'd use @concordium/browser-wallet-api-helpers
      // Example: const account = await detectConcordiumProvider().connect();
      
      // Simulating connection for demo
      setTimeout(() => {
        const demoAddress = '3kBx2h5Y4jo4CWC3kPNhqr2AXVQ5ZqbPGCAqvNcyJLMaJtqJ2k';
        setConcordiumAddress(demoAddress);
        setStatus('Concordium wallet connected (demo mode)');
      }, 1000);
    } catch (err: any) {
      setStatus(`Error connecting Concordium wallet: ${err?.message || String(err)}`);
    }
  };

  const onConnectEvm = async () => {
    try {
      const connector = connectors?.[0];
      if (!connector) throw new Error('No EVM connectors available');
      await connectEvm({ connector });
      setStatus('EVM wallet connected successfully!');
    } catch (err: any) {
      setStatus(`Error connecting EVM wallet: ${err?.message || String(err)}`);
    }
  };

  const startVerification = async () => {
    setStatus('Preparing verification...');
    setLoading(true);

    try {
      if (!concordiumAddress) throw new Error('Concordium wallet not connected.');
      if (!evmConnected || !evmAddress) throw new Error('EVM wallet not connected.');

      // 4.1 Define Statements
      const zkpStatement = {
        type: 'and',
        statements: [
          { type: 'reveal', attribute: 'firstName' },
          { type: 'reveal', attribute: 'lastName' },
          { type: 'predicate', attribute: 'dob', operator: '<=', value: getEighteenYearsAgoDate() },
          { type: 'in', attribute: 'nationality', values: ['DK', 'DE', 'GB'] },
        ],
      };

      // 4.2 Request Concordium ZKP
      setStatus('Waiting for Concordium proof...\n\nNote: Full Concordium integration requires the Browser Wallet API.\nThis is a demo showing the verification flow.');

      // Placeholder for Concordium proof
      await new Promise(resolve => setTimeout(resolve, 1500));
      const concordiumProof = {
        type: 'VerifiablePresentation',
        proof: 'demo_proof_placeholder',
        statement: zkpStatement,
      };

      // 4.3 Request EVM Signature
      setStatus('Waiting for EVM signature...');

      const message = `I am proving ownership of this address for Concordium ID verification: ${evmAddress}`;
      const evmSignature = await signMessageAsync({ message }).catch((e: any) => {
        throw new Error(`EVM signature rejected or failed: ${e?.message || String(e)}`);
      });

      // 4.4 Send to Backend
      setStatus('Sending to attestation service...');

      const payload = {
        concordiumProof,
        concordiumAddress,
        evmSignature,
        evmAddress,
      };

      const resp = await fetch('/api/verify-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        setStatus('Success! Your verification is being processed.\n\nPayload sent:\n' + JSON.stringify(payload, null, 2));
      } else {
        const text = await resp.text().catch(() => 'Unknown error');
        throw new Error(`Attestation service error: ${resp.status} ${text}`);
      }
    } catch (err: any) {
      setStatus(`Error: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={{ margin: '0 0 8px 0', color: '#111827' }}>VeriLoan</h1>
          <h2 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 600, color: '#2563eb' }}>
            Cross-Chain Identity Verification
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
            Connect Concordium and your EVM wallet to start verification
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />

        <div style={styles.section}>
          <div style={styles.label}>1. Concordium Wallet</div>
          <div style={styles.row}>
            <button
              style={{
                ...styles.button,
                ...(concordiumAddress ? styles.secondary : styles.primary),
              }}
              onClick={onConnectConcordium}
              disabled={!!concordiumAddress || loading}
            >
              {concordiumAddress ? '✓ Concordium Connected' : 'Connect Concordium Wallet'}
            </button>
          </div>
          {concordiumAddress && (
            <div style={styles.addressText}>Address: {concordiumAddress}</div>
          )}
        </div>

        <div style={styles.section}>
          <div style={styles.label}>2. EVM Wallet (MetaMask)</div>
          <div style={styles.row}>
            <button
              style={{
                ...styles.button,
                ...(evmConnected ? styles.secondary : styles.primary),
              }}
              onClick={onConnectEvm}
              disabled={evmConnected || loading}
            >
              {evmConnected ? '✓ EVM Connected' : 'Connect EVM Wallet'}
            </button>
          </div>
          {evmConnected && evmAddress && (
            <div style={styles.addressText}>Address: {evmAddress}</div>
          )}
        </div>

        <div style={styles.section}>
          <div style={styles.label}>3. Start Verification</div>
          <div style={styles.row}>
            <button
              style={{
                ...styles.button,
                ...((concordiumAddress && evmConnected && !loading) ? styles.primary : styles.disabled),
              }}
              onClick={startVerification}
              disabled={!(concordiumAddress && evmConnected) || loading}
            >
              {loading ? '⏳ Processing...' : 'Start Verification'}
            </button>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.label}>Status</div>
          <div style={styles.statusBox}>{status}</div>
        </div>

        <div style={{ marginTop: 16, padding: 12, background: '#fef3c7', borderRadius: 8, fontSize: 13 }}>
          <strong>ℹ️ Note:</strong> Full Concordium ZKP integration requires the Concordium Browser Wallet extension
          and proper API setup. This demo shows the UI flow and EVM wallet integration.
        </div>
      </div>
    </div>
  );
}

export default function App(): JSX.Element {
  return (
    <WagmiConfig config={wagmiConfig}>
      <VerificationDApp />
    </WagmiConfig>
  );
}
