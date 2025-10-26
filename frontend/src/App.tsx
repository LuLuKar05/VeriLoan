import React, { useState, useEffect } from 'react';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { mainnet } from 'wagmi/chains';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { useAccount, useConnect, useSignMessage, useDisconnect } from 'wagmi';
import { detectConcordiumProvider, WalletApi } from '@concordium/browser-wallet-api-helpers';
import { TermsAndConditionsCombined } from './TermsAndConditionsCombined';
import { ReportComponent } from './ReportComponent';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

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
  const { disconnect: disconnectEvm } = useDisconnect();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [evmConnecting, setEvmConnecting] = useState<boolean>(false);

  const [status, setStatus] = useState<string>('Ready to verify');
  const [loading, setLoading] = useState<boolean>(false);
  const [metaMaskDetected, setMetaMaskDetected] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [concordiumTermsSignature, setConcordiumTermsSignature] = useState<any>(null);
  const [evmTermsSignature, setEvmTermsSignature] = useState<any>(null);
  const [verificationComplete, setVerificationComplete] = useState<boolean>(false);

  // Detect MetaMask on mount
  useEffect(() => {
    const detectMetaMask = () => {
      if (typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask) {
        setMetaMaskDetected(true);
      } else {
        setMetaMaskDetected(false);
      }
    };
    
    detectMetaMask();
    
    // Recheck after a short delay in case MetaMask loads asynchronously
    const timer = setTimeout(detectMetaMask, 1000);
    return () => clearTimeout(timer);
  }, []);


  // Detect Concordium provider on mount
  useEffect(() => {
    const detectWallet = async () => {
      try {
        const provider = await detectConcordiumProvider(2000);
        setConcordiumProvider(provider);
        setStatus('Ready to verify. Wallets can be connected!');
      } catch (err) {
        setStatus('⚠️ Concordium Browser Wallet not found. Please install the extension.');
      }
    };
    
    detectWallet();
  }, []);

  // Clear any cached EVM connections on mount to ensure fresh connection flow
  useEffect(() => {
    const clearCachedConnection = async () => {
      // If wagmi thinks we're connected on mount, disconnect to force manual connection
      if (evmConnected) {
        await disconnectEvm();
        console.log('Cleared cached EVM connection on mount');
      }
    };
    
    clearCachedConnection();
  }, []); // Run only once on mount

  // Monitor EVM wallet connection state and disconnect if wallet is disconnected
  useEffect(() => {
    if (!metaMaskDetected) return;

    const checkEvmConnection = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          // If we think we're connected but no accounts available, disconnect
          if (evmConnected && (!accounts || accounts.length === 0)) {
            disconnectEvm();
            setStatus('⚠️ EVM wallet: Disconnected');
          }
          
          // If wagmi shows connected but MetaMask has no accounts, force disconnect
          if (evmConnected && evmAddress && (!accounts || accounts.length === 0)) {
            disconnectEvm();
            setStatus('⚠️ EVM wallet: Disconnected - please reconnect');
          }
        }
      } catch (err) {
        console.error('Error checking EVM connection:', err);
      }
    };

    checkEvmConnection();

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0 && evmConnected) {
        disconnectEvm();
        setStatus('⚠️ EVM wallet: Disconnected');
      }
    };

    // Listen for chain changes (might indicate disconnection)
    const handleChainChanged = () => {
      // Reload is recommended by MetaMask on chain change
      window.location.reload();
    };

    // Listen for disconnect event
    const handleDisconnect = () => {
      if (evmConnected) {
        disconnectEvm();
        setStatus('⚠️ EVM wallet: Disconnected');
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [evmConnected, evmAddress, metaMaskDetected, disconnectEvm]);

  const onConnectConcordium = async () => {
    // Prevent multiple concurrent connection attempts
    if (concordiumConnecting) {
      console.log('Connection already in progress, ignoring duplicate request');
      return;
    }

    setConcordiumConnecting(true);
    setStatus('Opening Concordium Browser Wallet...');
    
    try {
      if (!concordiumProvider) {
        throw new Error('Concordium Browser Wallet not detected');
      }

      setStatus('Please approve the connection and select an account in the Concordium Browser Wallet...');
      
      // Use only the standard connect() method to avoid duplicate wallet spawns
      const accountAddress = await concordiumProvider.connect();
      
      if (!accountAddress || accountAddress === '') {
        throw new Error('No account address available');
      }
      
      setConcordiumAddress(accountAddress);
      setStatus(`✅ Concordium wallet connected!\nAccount: ${accountAddress}`);
      
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      
      if (errorMessage.includes('User rejected') || errorMessage.includes('cancelled')) {
        setStatus('❌ Concordium wallet: Request denied by user');
      } else if (errorMessage.includes('No account')) {
        setStatus('❌ Concordium wallet: No account found. Please create an account in the Concordium Browser Wallet');
      } else {
        setStatus(`❌ Concordium wallet: ${errorMessage}`);
      }
      setConcordiumAddress(null);
    } finally {
      setConcordiumConnecting(false);
    }
  };

  const onConnectEvm = async () => {
    // Prevent multiple concurrent connection attempts
    if (evmConnecting) {
      console.log('EVM connection already in progress, ignoring duplicate request');
      return;
    }

    setEvmConnecting(true);
    
    try {
      if (!metaMaskDetected) {
        throw new Error('MetaMask not detected. Please install MetaMask browser extension.');
      }

      if (!window.ethereum) {
        throw new Error('MetaMask not available');
      }

      // First, completely disconnect any existing wagmi connection
      if (evmConnected) {
        await disconnectEvm();
        // Wait a bit for the disconnect to complete
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setStatus('Opening MetaMask popup...');

      // Request wallet_requestPermissions to FORCE the MetaMask popup to appear
      // This ensures the user has to manually approve the connection
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch (permError: any) {
        // If user rejects the permission request
        if (permError?.code === 4001 || permError?.message?.includes('User rejected')) {
          throw new Error('User rejected connection request');
        }
        // If wallet_requestPermissions is not supported, fall back to eth_requestAccounts
        console.log('wallet_requestPermissions not supported, using eth_requestAccounts');
      }

      setStatus('Requesting accounts from MetaMask...');

      // Now request accounts - this should show the popup if not already shown
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      setStatus('Connecting wallet...');

      // Find MetaMask connector specifically
      const metaMaskConnector = connectors.find(
        (connector) => connector.id === 'metaMask' || connector.name === 'MetaMask'
      );
      
      if (!metaMaskConnector) {
        throw new Error('MetaMask connector not found');
      }
      
      // Now connect using wagmi with the approved accounts
      await connectEvm({ connector: metaMaskConnector });
      
      setStatus(`✅ MetaMask connected!\nAddress: ${accounts[0]}`);
    } catch (err: any) {
      console.error('MetaMask connection error:', err);
      
      if (err?.code === 4001 || err?.message?.includes('User rejected') || err?.message?.includes('User denied')) {
        setStatus('❌ EVM wallet: Request denied by user');
      } else if (err?.message?.includes('MetaMask') && err?.message?.includes('not')) {
        setStatus('❌ EVM wallet: MetaMask not detected. Please install the MetaMask browser extension');
      } else {
        setStatus(`❌ EVM wallet: ${err?.message || String(err)}`);
      }
    } finally {
      setEvmConnecting(false);
    }
  };

  const startVerification = async () => {
    if (!concordiumAddress || !concordiumProvider) {
      setStatus('❌ Concordium wallet not connected');
      return;
    }
    if (!evmConnected || !evmAddress) {
      setStatus('❌ EVM wallet not connected');
      return;
    }

    // Show combined Terms & Conditions modal
    setShowTermsModal(true);
  };

  const handleBothTermsAccepted = async (concordiumSig: any, evmSig: any) => {
    setShowTermsModal(false);
    setConcordiumTermsSignature(concordiumSig);
    setEvmTermsSignature(evmSig);
    setStatus('✅ Both wallets signed and verified!\n\nProceeding with identity verification...');
    setLoading(true);

    // Wait a moment to show the success message
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Proceed with identity verification
    await proceedWithIdentityVerification();
  };

  const handleTermsCancelled = () => {
    setShowTermsModal(false);
    setStatus('Verification cancelled. You must accept terms to continue.');
  };

  const proceedWithIdentityVerification = async () => {
    try {
      if (!concordiumAddress || !concordiumProvider) throw new Error('Concordium wallet not connected');
      if (!evmConnected || !evmAddress) throw new Error('EVM wallet not connected');

      const zkpStatement = [
        {
          idQualifier: {
            type: 'cred' as const,
            issuers: [0, 1, 2, 3, 4, 5, 6, 7] as number[]  // Accept identity from any testnet issuer
          },
          statement: [
            { type: 'RevealAttribute' as const, attributeTag: 'firstName' as const },
            { type: 'RevealAttribute' as const, attributeTag: 'lastName' as const },
            { type: 'RevealAttribute' as const, attributeTag: 'nationality' as const },
            { 
              type: 'AttributeInRange' as const, 
              attributeTag: 'dob' as const,
              lower: '18000101',
              upper: getEighteenYearsAgoDate().replace(/-/g, '')
            }
          ]
        }
      ];

      // Get challenge from backend
      setStatus('Requesting challenge from backend...');
      const challengeResponse = await fetch('/api/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get challenge from backend');
      }

      const challengeData = await challengeResponse.json();
      const { challenge, sessionId } = challengeData;

      setStatus('Waiting for Concordium proof...');

      let concordiumProof: any = null;

      try {
        concordiumProof = await concordiumProvider.requestVerifiablePresentation(
          challenge,
          zkpStatement
        );

        if (!concordiumProof) {
          throw new Error('No proof returned from wallet');
        }

        setStatus('Proof received. Requesting EVM signature...');
      } catch (err: any) {
        throw new Error(`Concordium proof failed: ${err?.message || String(err)}`);
      }

      setStatus('Waiting for EVM signature...');

      const message = `I am proving ownership of this address for Concordium ID verification: ${evmAddress}`;
      const evmSignature = await signMessageAsync({ message }).catch((e: any) => {
        throw new Error(`EVM signature failed: ${e?.message || String(e)}`);
      });

      setStatus('Sending to verification service...');

      const payload = {
        concordiumProof,
        concordiumAddress,
        evmSignature,
        evmAddress,
        sessionId,
        concordiumTermsAcceptance: concordiumTermsSignature,
        evmTermsAcceptance: evmTermsSignature,
      };

      const resp = await fetch('/api/verify-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        setStatus('✅ Verification successful!\n\n' + JSON.stringify(payload, null, 2));
        setVerificationComplete(true);
      } else {
        const text = await resp.text().catch(() => 'Unknown error');
        throw new Error(`Service error: ${resp.status} ${text}`);
      }
    } catch (err: any) {
      setStatus(`❌ Error: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {showTermsModal && (
        <TermsAndConditionsCombined
          concordiumProvider={concordiumProvider}
          concordiumAddress={concordiumAddress}
          evmAddress={evmAddress}
          onBothAccepted={handleBothTermsAccepted}
          onCancel={handleTermsCancelled}
        />
      )}

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
            <>
              <div style={styles.addressText}>Account: {concordiumAddress}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8, padding: 8, background: '#f3f4f6', borderRadius: 6 }}>
                <strong>💡 To change accounts:</strong> Open the Concordium Browser Wallet extension → Select a different account → Then click the connect button above again
              </div>
            </>
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
              disabled={evmConnected || loading || evmConnecting || !metaMaskDetected}
            >
              {evmConnecting ? '⏳ Opening Wallet...' : evmConnected ? '✅ MetaMask Connected' : '🦊 Connect MetaMask'}
            </button>
          </div>
          {evmConnected && evmAddress && (
            <div style={styles.addressText}>Address: {evmAddress}</div>
          )}
          {!metaMaskDetected && (
            <div style={{ ...styles.addressText, color: '#dc2626', marginTop: 4 }}>
              ⚠️ MetaMask extension not detected
            </div>
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
          <strong>ℹ️ Wallet Detection Status:</strong>
          <br />
          • Concordium: {concordiumProvider ? '✅ Detected' : '❌ Not Detected'}
          <br />
          • MetaMask: {metaMaskDetected ? '✅ Detected' : '❌ Not Detected'}
          
          {(!concordiumProvider || !metaMaskDetected) && (
            <>
              <br /><br />
              <strong>⚠️ Missing Wallets:</strong>
              {!concordiumProvider && (
                <>
                  <br />
                  → Install{' '}
                  <a 
                    href="https://chrome.google.com/webstore/detail/concordium-wallet/mnnkpffndmickbiakofclnpoiajlegmg" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#2563eb', textDecoration: 'underline' }}
                  >
                    Concordium Browser Wallet
                  </a>
                </>
              )}
              {!metaMaskDetected && (
                <>
                  <br />
                  → Install{' '}
                  <a 
                    href="https://metamask.io/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#2563eb', textDecoration: 'underline' }}
                  >
                    MetaMask Extension
                  </a>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Report Component - Shows after successful verification */}
      {verificationComplete && concordiumAddress && (
        <div style={{ marginTop: '24px', width: '100%', maxWidth: 900 }}>
          <ReportComponent 
            concordiumAddress={concordiumAddress}
            backendUrl="http://localhost:8000"
          />
        </div>
      )}
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
