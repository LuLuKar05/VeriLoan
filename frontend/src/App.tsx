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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    background: '#1a1c1b',
    color: '#ffffff',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    background: '#2a2c2b',
    borderRadius: 12,
    padding: 32,
    boxShadow: '0 6px 18px rgba(89, 255, 0, 0.15)',
    border: '1px solid rgba(89, 255, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  header: { textAlign: 'center' },
  section: { display: 'flex', flexDirection: 'column', gap: 12 },
  label: { 
    fontSize: 14, 
    color: '#e5e7eb', 
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    padding: '12px 24px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 15,
    transition: 'all 0.2s',
    width: '100%',
    maxWidth: 320,
    margin: '0 auto',
  },
  primary: { 
    background: '#59ff00', 
    color: '#1a1c1b',
    boxShadow: '0 0 20px rgba(89, 255, 0, 0.3)',
  },
  secondary: { 
    background: '#555D58', 
    color: '#e5e7eb',
    border: '1px solid rgba(89, 255, 0, 0.3)',
  },
  disabled: { 
    background: '#555D58', 
    color: '#9ca3af', 
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  row: { display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  addressText: { fontFamily: 'monospace', fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 8 },
  statusBadge: {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 12,
    fontWeight: 500,
  },
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
      } catch (err) {
        // Concordium Browser Wallet not found
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
          }
          
          // If wagmi shows connected but MetaMask has no accounts, force disconnect
          if (evmConnected && evmAddress && (!accounts || accounts.length === 0)) {
            disconnectEvm();
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
      return;
    }

    setConcordiumConnecting(true);
    
    try {
      if (!concordiumProvider) {
        throw new Error('Concordium Browser Wallet not detected');
      }
      
      // Use only the standard connect() method to avoid duplicate wallet spawns
      const accountAddress = await concordiumProvider.connect();
      
      if (!accountAddress || accountAddress === '') {
        throw new Error('No account address available');
      }
      
      setConcordiumAddress(accountAddress);
      
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      console.error('Concordium connection error:', errorMessage);
      setConcordiumAddress(null);
    } finally {
      setConcordiumConnecting(false);
    }
  };

  const onConnectEvm = async () => {
    // Prevent multiple concurrent connection attempts
    if (evmConnecting) {
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
      }

      // Now request accounts - this should show the popup if not already shown
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      // Find MetaMask connector specifically
      const metaMaskConnector = connectors.find(
        (connector) => connector.id === 'metaMask' || connector.name === 'MetaMask'
      );
      
      if (!metaMaskConnector) {
        throw new Error('MetaMask connector not found');
      }
      
      // Now connect using wagmi with the approved accounts
      await connectEvm({ connector: metaMaskConnector });
      
    } catch (err: any) {
      console.error('MetaMask connection error:', err);
    } finally {
      setEvmConnecting(false);
    }
  };

  const startVerification = async () => {
    if (!concordiumAddress || !concordiumProvider) {
      alert('Please connect your Concordium wallet first');
      return;
    }
    if (!evmConnected || !evmAddress) {
      alert('Please connect your MetaMask wallet first');
      return;
    }

    // Show combined Terms & Conditions modal
    setShowTermsModal(true);
  };

  const handleBothTermsAccepted = async (concordiumSig: any, evmSig: any) => {
    setShowTermsModal(false);
    setConcordiumTermsSignature(concordiumSig);
    setEvmTermsSignature(evmSig);
    setLoading(true);

    // Proceed with identity verification
    await proceedWithIdentityVerification();
  };

  const handleTermsCancelled = () => {
    setShowTermsModal(false);
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
      const challengeResponse = await fetch('/api/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get challenge from backend');
      }

      const challengeData = await challengeResponse.json();
      const { challenge, sessionId } = challengeData;

      let concordiumProof: any = null;

      try {
        concordiumProof = await concordiumProvider.requestVerifiablePresentation(
          challenge,
          zkpStatement
        );

        if (!concordiumProof) {
          throw new Error('No proof returned from wallet');
        }

      } catch (err: any) {
        throw new Error(`Concordium proof failed: ${err?.message || String(err)}`);
      }

      const message = `I am proving ownership of this address for Concordium ID verification: ${evmAddress}`;
      const evmSignature = await signMessageAsync({ message }).catch((e: any) => {
        throw new Error(`EVM signature failed: ${e?.message || String(e)}`);
      });

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
        setVerificationComplete(true);
      } else {
        const text = await resp.text().catch(() => 'Unknown error');
        throw new Error(`Service error: ${resp.status} ${text}`);
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      alert(`Verification failed: ${err?.message || String(err)}`);
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
          <h1 style={{ margin: '0 0 12px 0', fontSize: 32, color: '#59ff00', fontWeight: 700, textShadow: '0 0 20px rgba(89, 255, 0, 0.5)' }}>VeriLoan</h1>
          <h2 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 600, color: '#59ff00' }}>
            Cross-Chain Identity Verification
          </h2>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: 15 }}>
            Connect both wallets to start verification
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(89, 255, 0, 0.2)', margin: '20px 0' }} />

        <div style={styles.section}>
          <div style={styles.label}>
            <span>1. Concordium Wallet</span>
            {concordiumProvider ? (
              <span style={{ ...styles.statusBadge, background: 'rgba(89, 255, 0, 0.2)', color: '#59ff00', border: '1px solid rgba(89, 255, 0, 0.4)' }}>
                ✓ Detected
              </span>
            ) : (
              <span style={{ ...styles.statusBadge, background: 'rgba(255, 0, 0, 0.15)', color: '#ff4444', border: '1px solid rgba(255, 0, 0, 0.3)' }}>
                Not Detected
              </span>
            )}
          </div>
          <div style={styles.row}>
            <button
              style={{
                ...styles.button,
                ...(concordiumAddress ? styles.secondary : styles.primary),
              }}
              onClick={onConnectConcordium}
              disabled={!!concordiumAddress || loading || concordiumConnecting || !concordiumProvider}
            >
              {concordiumConnecting ? '⏳ Opening Wallet...' : concordiumAddress ? '✅ Connected' : '🔐 Connect Concordium'}
            </button>
          </div>
          {concordiumAddress && (
            <div style={styles.addressText}>{concordiumAddress}</div>
          )}
          {!concordiumProvider && (
            <div style={{ fontSize: 13, color: '#ff4444', textAlign: 'center', marginTop: 8 }}>
              Please install{' '}
              <a 
                href="https://chrome.google.com/webstore/detail/concordium-wallet/mnnkpffndmickbiakofclnpoiajlegmg" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#59ff00', textDecoration: 'underline' }}
              >
                Concordium Browser Wallet
              </a>
            </div>
          )}
        </div>

        <div style={styles.section}>
          <div style={styles.label}>
            <span>2. EVM Wallet (MetaMask)</span>
            {metaMaskDetected ? (
              <span style={{ ...styles.statusBadge, background: 'rgba(89, 255, 0, 0.2)', color: '#59ff00', border: '1px solid rgba(89, 255, 0, 0.4)' }}>
                ✓ Detected
              </span>
            ) : (
              <span style={{ ...styles.statusBadge, background: 'rgba(255, 0, 0, 0.15)', color: '#ff4444', border: '1px solid rgba(255, 0, 0, 0.3)' }}>
                Not Detected
              </span>
            )}
          </div>
          <div style={styles.row}>
            <button
              style={{
                ...styles.button,
                ...(evmConnected ? styles.secondary : styles.primary),
              }}
              onClick={onConnectEvm}
              disabled={evmConnected || loading || evmConnecting || !metaMaskDetected}
            >
              {evmConnecting ? '⏳ Opening Wallet...' : evmConnected ? '✅ Connected' : '🦊 Connect MetaMask'}
            </button>
          </div>
          {evmConnected && evmAddress && (
            <div style={styles.addressText}>{evmAddress}</div>
          )}
          {!metaMaskDetected && (
            <div style={{ fontSize: 13, color: '#ff4444', textAlign: 'center', marginTop: 8 }}>
              Please install{' '}
              <a 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#59ff00', textDecoration: 'underline' }}
              >
                MetaMask Extension
              </a>
            </div>
          )}
        </div>

        <div style={styles.section}>
          <div style={styles.label}>
            <span>3. Start Verification</span>
          </div>
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
          {verificationComplete && (
            <div style={{ marginTop: 12, padding: 16, background: 'rgba(89, 255, 0, 0.15)', borderRadius: 8, fontSize: 15, color: '#59ff00', fontWeight: 500, textAlign: 'center', border: '1px solid rgba(89, 255, 0, 0.3)' }}>
              ✅ Verification successful! Generate your report below.
            </div>
          )}
        </div>

        {/* Report Component - Shows after successful verification */}
        {verificationComplete && concordiumAddress && (
          <div style={{ marginTop: 8 }}>
            <hr style={{ border: 'none', borderTop: '1px solid rgba(89, 255, 0, 0.2)', margin: '20px 0' }} />
            <ReportComponent 
              concordiumAddress={concordiumAddress}
              backendUrl="http://localhost:8000"
            />
          </div>
        )}
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
