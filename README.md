# VeriLoan - Cross-Chain Identity Verification dApp

A decentralized application that enables users to verify their identity across blockchains using Concordium's Zero-Knowledge Proofs (ZKP) and Ethereum wallets.

## 🎯 Features

- ✅ **Concordium Identity Integration** - Real browser wallet connection with ZKP
- ✅ **EVM Wallet Support** - MetaMask and WalletConnect integration via Wagmi
- ✅ **Zero-Knowledge Proofs** - Privacy-preserving identity verification
- ✅ **Attribute Revelation** - Selective disclosure of identity attributes
- ✅ **Cross-Chain** - Links Concordium identity with EVM addresses
- ✅ **Backend Verification** - Cryptographic proof validation
- ✅ **Secure Challenge-Response** - Prevents replay attacks

## 🏗️ Architecture

```
VeriLoan/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx   # Main application with wallet connections
│   │   └── main.tsx  # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── backend/           # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── index.ts     # API server
│   │   └── verifier.ts  # ZKP verification logic
│   ├── package.json
│   └── .env
│
└── package.json       # Monorepo root
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- [Concordium Browser Wallet](https://chrome.google.com/webstore/detail/concordium-wallet/mnnkpffndmickbiakofclnpoiajlegmg) extension
- MetaMask extension

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/LuLuKar05/VeriLoan.git
cd VeriLoan
```

2. **Install all dependencies**
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

3. **Configure backend**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

### Development

**Start both frontend and backend:**

In separate terminals:

```bash
# Terminal 1 - Backend (port 8000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 3000)  
cd frontend
npm run dev
```

Or from root:
```bash
npm run dev:backend  # Start backend only
npm run dev          # Start frontend only
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## 📋 Verification Flow

1. **User connects Concordium wallet** 
   - Frontend detects browser wallet extension
   - Calls `getMostRecentlySelectedAccount()` or `connect()`
   - Retrieves real account address

2. **User connects EVM wallet**
   - MetaMask popup appears
   - User approves connection
   - Frontend stores EVM address

3. **User initiates verification**
   - Frontend requests ZKP from Concordium wallet
   - User approves in wallet extension
   - Wallet returns verifiable presentation with:
     - Revealed attributes (name, etc.)
     - Range proofs (age 18+)
     - Set membership proofs (nationality)

4. **Frontend requests EVM signature**
   - MetaMask signs ownership proof message
   - Returns signature

5. **Backend verification**
   - Validates ZKP cryptographically
   - Checks challenge to prevent replay
   - Extracts unique user ID
   - Extracts revealed attributes
   - Verifies EVM signature

6. **Attestation** (Future)
   - Create on-chain attestation
   - Link Concordium ID to EVM address

## 🔧 Technologies

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Wagmi** - EVM wallet integration
- **@concordium/browser-wallet-api-helpers** - Concordium wallet SDK

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **@concordium/web-sdk** - Concordium SDK
- **tsx** - TypeScript execution

## 📡 API Endpoints

### `GET /health`
Health check

### `POST /api/challenge`
Generate verification challenge
```json
Response: {
  "sessionId": "uuid",
  "challenge": "VeriLoan-timestamp-random",
  "expiresIn": 300
}
```

### `POST /api/verify-identity`
Verify ZKP and EVM signature
```json
Request: {
  "concordiumProof": {...},
  "concordiumAddress": "3kBx2h5Y...",
  "evmSignature": "0x123...",
  "evmAddress": "0xabc...",
  "sessionId": "uuid"
}

Response: {
  "success": true,
  "verification": {
    "concordium": {
      "verified": true,
      "uniqueUserId": "...",
      "revealedAttributes": {...}
    },
    "evm": {
      "verified": true,
      "address": "0xabc..."
    }
  }
}
```

## 🔐 Security Features

- ✅ Challenge-response authentication
- ✅ One-time use challenges (5 min expiry)
- ✅ CORS protection
- ✅ Input validation
- ✅ Cryptographic proof verification
- ✅ Secure wallet connections

## 🧪 Testing

```bash
# Frontend
cd frontend
npm run lint

# Backend  
cd backend
npm run lint
```

## 📦 Building for Production

```bash
# Build both frontend and backend
npm run build

# Or individually
npm run build:frontend
npm run build:backend
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Concordium Documentation](https://developer.concordium.software/)
- [Concordium Browser Wallet](https://chrome.google.com/webstore/detail/concordium-wallet/mnnkpffndmickbiakofclnpoiajlegmg)
- [Wagmi Documentation](https://wagmi.sh/)

## 👥 Team

Built for cross-chain identity verification hackathon

---

**Note:** This is a demonstration project. For production use, additional security measures, testing, and auditing are required.

VeriLoan creates trustworthy borrower profiles for DeFi. These profiles are secure, private, and follow the rules. This service helps lenders safely offer better loans and, in the future, loans that aren't fully collateralized.
