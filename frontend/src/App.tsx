import React, { useState, useEffect } from 'react';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { mainnet } from 'wagmi/chains';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { useAccount, useConnect, useSignMessage } from 'wagmi';
import { detectConcordiumProvider, WalletApi } from '@concordium/browser-wallet-api-helpers';

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
  // Concordium state
  const [concordiumAddress, setConcordiumAddress] = useState<string | null>(null);
  const [concordiumProvider, setConcordiumProvider] = useState<WalletApi | null>(null);
  const [concordiumConnecting, setConcordiumConnecting] = useState<boolean>(false);

  // EVM (wagmi)
  const { connect: connectEvm, connectors } = useConnect();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [status, setStatus] = useState<string>('Ready to verify');
  const [loading, setLoading] = useState<boolean>(false);

  // Detect Concordium provider on mount
  useEffect(() => {
    const detectWallet = async () => {
      try {
        console.log('Attempting to detect Concordium Browser Wallet...');
        // Give the extension time to inject itself (timeout in ms)
        const provider = await detectConcordiumProvider(2000);
        setConcordiumProvider(provider);
        console.log('✅ Concordium Browser Wallet detected successfully!', provider);
        console.log('Provider methods:', Object.keys(provider));
        setStatus('Ready to verify. Concordium wallet detected!');
      } catch (err) {
        console.error('❌ Concordium Browser Wallet not detected:', err);
        console.log('Please install the Concordium Browser Wallet extension');
        setStatus('⚠️ Concordium Browser Wallet extension not found. Please install it from the Chrome Web Store.');
      }
    };
    
    detectWallet();
  }, []);

  const onConnectConcordium = async () => {
    setConcordiumConnecting(true);
    setStatus('Connecting to Concordium Browser Wallet...');
    
    try {
      if (!concordiumProvider) {
        throw new Error('Concordium Browser Wallet not detected. Please install the extension from Chrome Web Store.');
      }

      console.log('🔐 Connecting to Concordium wallet...');
      
      // First, try to get the most recent connected account
      let accountAddress = await concordiumProvider.getMostRecentlySelectedAccount();
      
      console.log('Most recently selected account:', accountAddress);
      
      // If no account is selected, request connection (this will show popup if needed)
      if (!accountAddress) {
        console.log('No account selected, requesting connection...');
        setStatus('Please approve the connection in the Concordium Browser Wallet extension...');
        accountAddress = await concordiumProvider.connect();
      }
      
      console.log('✅ Account retrieved:', accountAddress);
      
      if (!accountAddress || accountAddress === '') {
        throw new Error('No account address available. Please:\n1. Open the Concordium Browser Wallet extension\n2. Make sure you have an account created\n3. Select an account in the wallet\n4. Try connecting again');
      }
      
      setConcordiumAddress(accountAddress);
      setStatus(`✅ Concordium wallet connected!\n\n📍 Your Account: ${accountAddress}\n\nThis is your real Concordium account ID from the browser wallet.\n\nNow connect your EVM wallet to proceed.`);
      console.log('💾 Successfully connected with account:', accountAddress);
      
    } catch (err: any) {
      console.error('❌ Concordium connection error:', err);
      console.error('Error details:', {
        message: err?.message,
        code: err?.code,
        stack: err?.stack
      });
      
      const errorMessage = err?.message || String(err);
      
      if (errorMessage.includes('User rejected') || errorMessage.includes('cancelled') || errorMessage.includes('denied')) {
        setStatus('❌ Connection request denied.\n\nClick the button again and approve the request in the Concordium Browser Wallet extension.');
      } else if (errorMessage.includes('No account')) {
        setStatus('❌ No account found in wallet.\n\nPlease:\n1. Open the Concordium Browser Wallet extension\n2. Create or import an account\n3. Try connecting again');
      } else {
        setStatus(`❌ Error connecting to Concordium wallet:\n\n${errorMessage}\n\nTroubleshooting:\n1. Make sure the Concordium Browser Wallet extension is installed\n2. Open the extension and create/unlock your account\n3. Refresh this page and try again`);
      }
      setConcordiumAddress(null);
    } finally {
      setConcordiumConnecting(false);
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
      if (!concordiumAddress || !concordiumProvider) throw new Error('Concordium wallet not connected.');
      if (!evmConnected || !evmAddress) throw new Error('EVM wallet not connected.');

      // 4.1 Define Statements for ZKP (Concordium credential statements format)
      const zkpStatement = [
        {
          idQualifier: {
            type: 'cred' as const,
            issuers: [] as number[]
          },
          statement: [
            { type: 'RevealAttribute' as const, attributeTag: 'firstName' as const },
            { type: 'RevealAttribute' as const, attributeTag: 'lastName' as const },
            { 
              type: 'AttributeInRange' as const, 
              attributeTag: 'dob' as const,
              lower: '18000101',
              upper: getEighteenYearsAgoDate().replace(/-/g, '')
            },
            { 
              type: 'AttributeInSet' as const, 
              attributeTag: 'nationality' as const,
              set: ['DK', 'DE', 'GB']
            }
          ]
        }
      ];

      // 4.2 Request Concordium ZKP (Verifiable Presentation)
      setStatus('Waiting for Concordium proof...\n\nPlease approve the request in your Concordium Browser Wallet.');

      let concordiumProof: any = null;

      try {
        // Request verifiable presentation from the Concordium wallet
        concordiumProof = await concordiumProvider.requestVerifiablePresentation(
          'VeriLoan Identity Verification',
          zkpStatement
        );

        if (!concordiumProof) {
          throw new Error('No proof returned from Concordium wallet.');
        }

        setStatus('Concordium proof received successfully!\n\nNow requesting EVM signature...');
      } catch (err: any) {
        throw new Error(`Concordium proof request failed: ${err?.message || String(err)}`);
      }

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
              disabled={!!concordiumAddress || loading || concordiumConnecting || !concordiumProvider}
            >
              {concordiumConnecting ? '⏳ Opening Wallet...' : concordiumAddress ? '✅ Concordium Connected' : '🔐 Connect Concordium Wallet'}
            </button>
          </div>
          {concordiumAddress && (
            <div style={styles.addressText}>Account: {concordiumAddress}</div>
          )}
          {!concordiumProvider && (
            <div style={{ ...styles.addressText, color: '#dc2626', marginTop: 4 }}>
              ⚠️ Concordium Browser Wallet not detected
            </div>
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

        <div style={{ marginTop: 16, padding: 12, background: '#e0f2fe', borderRadius: 8, fontSize: 13 }}>
          <strong>ℹ️ Integration Status:</strong> This app is now connected to the Concordium Browser Wallet!
          {!concordiumProvider && (
            <>
              <br /><br />
              <strong>⚠️ Wallet Not Detected:</strong> Please install the{' '}
              <a 
                href="https://chrome.google.com/webstore/detail/concordium-wallet/mnnkpffndmickbiakofclnpoiajlegmg" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#2563eb', textDecoration: 'underline' }}
              >
                Concordium Browser Wallet extension
              </a>
              {' '}to use this feature.
            </>
          )}
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
