# VeriLoan - Cross-Chain Identity Verification & DeFi Lending Report# VeriLoan - Cross-Chain Identity Verification dApp



> Privacy-preserving identity verification for DeFi lending using Concordium's Zero-Knowledge Proofs and EVM wallet integration.A decentralized application that enables users to verify their identity across blockchains using Concordium's Zero-Knowledge Proofs (ZKP) and Ethereum wallets.



VeriLoan creates trustworthy borrower profiles for DeFi. These profiles are secure, private, and follow regulatory requirements. This service helps lenders safely offer better loans and enables future under-collateralized lending.## 🎯 Features



## 🎯 Features- ✅ **Concordium Identity Integration** - Real browser wallet connection with ZKP

- ✅ **EVM Wallet Support** - MetaMask and WalletConnect integration via Wagmi

- ✅ **Concordium Identity Integration** - Real browser wallet connection with ZKP- ✅ **Zero-Knowledge Proofs** - Privacy-preserving identity verification

- ✅ **EVM Wallet Support** - MetaMask integration via Wagmi- ✅ **Attribute Revelation** - Selective disclosure of identity attributes

- ✅ **Zero-Knowledge Proofs** - Privacy-preserving identity verification- ✅ **Cross-Chain** - Links Concordium identity with EVM addresses

- ✅ **Cross-Chain Verification** - Links Concordium identity with EVM addresses- ✅ **Backend Verification** - Cryptographic proof validation

- ✅ **DeFi Lending Reports** - Aggregate lending history from multiple protocols- ✅ **Secure Challenge-Response** - Prevents replay attacks

- ✅ **Backend Verification** - Cryptographic proof validation

- ✅ **Secure Challenge-Response** - Prevents replay attacks## 🏗️ Architecture

- ✅ **Modern Dark UI** - Cyberpunk-themed interface with neon accents

```

## 🏗️ ArchitectureVeriLoan/

├── frontend/          # React + TypeScript + Vite

```│   ├── src/

VeriLoan/│   │   ├── App.tsx   # Main application with wallet connections

├── frontend/              # React + TypeScript + Vite│   │   └── main.tsx  # Entry point

│   ├── src/│   ├── package.json

│   │   ├── App.tsx                         # Main application│   └── vite.config.ts

│   │   ├── ReportComponent.tsx             # User report generator│

│   │   ├── TermsAndConditionsCombined.tsx  # T&C modal├── backend/           # Node.js + Express + TypeScript

│   │   └── main.tsx                        # Entry point│   ├── src/

│   ├── package.json│   │   ├── index.ts     # API server

│   └── vite.config.ts│   │   └── verifier.ts  # ZKP verification logic

││   ├── package.json

├── backend/               # Node.js + Express + TypeScript│   └── .env

│   ├── src/│

│   │   ├── index.ts            # API server└── package.json       # Monorepo root

│   │   ├── verifier.ts         # ZKP verification```

│   │   ├── database.ts         # MongoDB connection

│   │   ├── hasura-client.ts    # Hasura GraphQL client## 🚀 Quick Start

│   │   └── routes/

│   ├── package.json### Prerequisites

│   └── tsconfig.json

│- Node.js 18+ 

├── envio-server/          # Envio indexer (optional)- npm or yarn

└── package.json           # Monorepo root- [Concordium Browser Wallet](https://chrome.google.com/webstore/detail/concordium-wallet/mnnkpffndmickbiakofclnpoiajlegmg) extension

```- MetaMask extension



## 🚀 Quick Start### Installation



### Prerequisites1. **Clone the repository**

```bash

- **Node.js 18+** and npmgit clone https://github.com/LuLuKar05/VeriLoan.git

- **MongoDB** (local or cloud instance)cd VeriLoan

- **Hasura GraphQL** endpoint (for DeFi data)```

- **[Concordium Browser Wallet](https://chrome.google.com/webstore/detail/concordium-wallet/mnnkpffndmickbiakofclnpoiajlegmg)** extension

- **MetaMask** extension2. **Install all dependencies**

```bash

### Installationnpm install

cd frontend && npm install

1. **Clone the repository**cd ../backend && npm install

```bash```

git clone https://github.com/Ei-Sandi/VeriLoan-Poc.git

cd VeriLoan-Poc3. **Configure backend**

``````bash

cd backend

2. **Install all dependencies**cp .env.example .env

```bash# Edit .env with your configuration

npm install```

```

### Development

3. **Configure backend environment**

```bash**Start both frontend and backend:**

cd backend

cp .env.example .envIn separate terminals:

# Edit .env with your configuration:

# - MONGODB_URI```bash

# - HASURA_ENDPOINT# Terminal 1 - Backend (port 8000)

# - HASURA_ADMIN_SECRETcd backend

```npm run dev



4. **Start MongoDB**# Terminal 2 - Frontend (port 3000)  

```bashcd frontend

# Linux/Macnpm run dev

mongod --dbpath ./data```



# Or if MongoDB is a system serviceOr from root:

sudo systemctl start mongod```bash

```npm run dev:backend  # Start backend only

npm run dev          # Start frontend only

### Development```



**Start both frontend and backend concurrently:****Access the application:**

- Frontend: http://localhost:3000

```bash- Backend API: http://localhost:8000

npm run dev

```## 📋 Verification Flow



This will start:1. **User connects Concordium wallet** 

- **Backend** on http://localhost:8000   - Frontend detects browser wallet extension

- **Frontend** on http://localhost:3001   - Calls `getMostRecentlySelectedAccount()` or `connect()`

   - Retrieves real account address

Or run them individually:

```bash2. **User connects EVM wallet**

npm run dev:backend   # Backend only   - MetaMask popup appears

npm run dev:frontend  # Frontend only   - User approves connection

```   - Frontend stores EVM address



## 📋 Verification Flow3. **User initiates verification**

   - Frontend requests ZKP from Concordium wallet

### 1. Connect Wallets   - User approves in wallet extension

- User connects **Concordium wallet** (browser extension)   - Wallet returns verifiable presentation with:

- User connects **EVM wallet** (MetaMask)     - Revealed attributes (name, etc.)

     - Range proofs (age 18+)

### 2. Identity Verification     - Set membership proofs (nationality)

- User initiates verification process

- Frontend requests **ZKP** from Concordium wallet4. **Frontend requests EVM signature**

- Wallet returns verifiable presentation with:   - MetaMask signs ownership proof message

  - Revealed attributes (name, nationality, etc.)   - Returns signature

  - Range proofs (age verification)

  - Set membership proofs5. **Backend verification**

- Frontend requests **EVM signature** from MetaMask   - Validates ZKP cryptographically

   - Checks challenge to prevent replay

### 3. Backend Verification   - Extracts unique user ID

- Validates **ZKP cryptographically**   - Extracts revealed attributes

- Checks challenge to prevent replay attacks   - Verifies EVM signature

- Extracts unique user ID

- Verifies EVM signature6. **Attestation** (Future)

- Stores pairing in MongoDB   - Create on-chain attestation

   - Link Concordium ID to EVM address

### 4. Generate Report

- User can generate comprehensive lending report## 🔧 Technologies

- Backend fetches:

  - User identity from MongoDB### Frontend

  - DeFi lending data from Hasura GraphQL- **React 18** - UI framework

- Aggregates loan history, repayments, liquidations- **TypeScript** - Type safety

- Returns formatted report with metrics- **Vite** - Build tool

- **Wagmi** - EVM wallet integration

## 🔧 Technologies- **@concordium/browser-wallet-api-helpers** - Concordium wallet SDK



### Frontend### Backend

- **React 18** with TypeScript- **Node.js** - Runtime

- **Vite** - Fast build tool- **Express** - Web framework

- **Wagmi** - EVM wallet integration- **TypeScript** - Type safety

- **@concordium/browser-wallet-api-helpers** - Concordium SDK- **@concordium/web-sdk** - Concordium SDK

- **Inline CSS** - Dark theme styling- **tsx** - TypeScript execution



### Backend## 📡 API Endpoints

- **Node.js + Express** with TypeScript

- **MongoDB** - Identity storage### `GET /health`

- **Hasura GraphQL** - DeFi data indexingHealth check

- **@concordium/web-sdk** - ZKP verification

- **tsx** - TypeScript execution### `POST /api/challenge`

Generate verification challenge

### Data Sources```json

- **Hasura** - Indexed DeFi lending eventsResponse: {

- **Envio** - Blockchain data indexer (optional)  "sessionId": "uuid",

  "challenge": "VeriLoan-timestamp-random",

## 📡 API Endpoints  "expiresIn": 300

}

### Health Check```

```http

GET /health### `POST /api/verify-identity`

Response: { "status": "ok", "timestamp": "..." }Verify ZKP and EVM signature

``````json

Request: {

### Generate Challenge  "concordiumProof": {...},

```http  "concordiumAddress": "3kBx2h5Y...",

POST /api/challenge  "evmSignature": "0x123...",

Response: {  "evmAddress": "0xabc...",

  "sessionId": "uuid",  "sessionId": "uuid"

  "challenge": "VeriLoan-timestamp-random",}

  "expiresIn": 300

}Response: {

```  "success": true,

  "verification": {

### Verify Identity    "concordium": {

```http      "verified": true,

POST /api/verify-identity      "uniqueUserId": "...",

Body: {      "revealedAttributes": {...}

  "concordiumProof": {...},    },

  "concordiumAddress": "3kBx2h5Y...",    "evm": {

  "evmSignature": "0x123...",      "verified": true,

  "evmAddress": "0xabc...",      "address": "0xabc..."

  "sessionId": "uuid"    }

}  }

}

Response: {```

  "success": true,

  "verification": { ... }## 🔐 Security Features

}

```- ✅ Challenge-response authentication

- ✅ One-time use challenges (5 min expiry)

### Generate User Report- ✅ CORS protection

```http- ✅ Input validation

POST /api/report/:concordiumAddress- ✅ Cryptographic proof verification

Response: {- ✅ Secure wallet connections

  "identity": { ... },

  "pairedWallets": [ ... ],## 🧪 Testing

  "defiData": {

    "loans": [ ... ],```bash

    "repayments": [ ... ],# Frontend

    "liquidations": [ ... ],cd frontend

    "metrics": { ... }npm run lint

  }

}# Backend  

```cd backend

npm run lint

## 🔐 Security Features```



- ✅ Challenge-response authentication## 📦 Building for Production

- ✅ One-time use challenges (5 min expiry)

- ✅ CORS protection```bash

- ✅ Input validation# Build both frontend and backend

- ✅ Cryptographic proof verificationnpm run build

- ✅ Secure wallet connections

- ✅ MongoDB secure storage# Or individually

npm run build:frontend

## 📦 Scriptsnpm run build:backend

```

### Root Level

```bash## 🤝 Contributing

npm run dev              # Start both frontend & backend

npm run dev:frontend     # Start frontend onlyContributions are welcome! Please feel free to submit a Pull Request.

npm run dev:backend      # Start backend only

npm run build            # Build all workspaces## 📄 License

npm run lint             # Lint frontend

npm run install-all      # Install all dependenciesMIT License - see LICENSE file for details

```

## 🔗 Links

### Frontend

```bash- [Concordium Documentation](https://developer.concordium.software/)

cd frontend- [Concordium Browser Wallet](https://chrome.google.com/webstore/detail/concordium-wallet/mnnkpffndmickbiakofclnpoiajlegmg)

npm run dev              # Start dev server (port 3001)- [Wagmi Documentation](https://wagmi.sh/)

npm run build            # Production build

npm run preview          # Preview production build## 👥 Team

npm run lint             # ESLint check

```Built for cross-chain identity verification hackathon



### Backend---

```bash

cd backend**Note:** This is a demonstration project. For production use, additional security measures, testing, and auditing are required.

npm run dev              # Start dev server (port 8000)

npm run build            # Compile TypeScriptVeriLoan creates trustworthy borrower profiles for DeFi. These profiles are secure, private, and follow the rules. This service helps lenders safely offer better loans and, in the future, loans that aren't fully collateralized.

npm start                # Run compiled code
```

## 🧪 Testing

Make sure MongoDB is running, then test the backend:

```bash
cd backend
npm run dev

# In another terminal
curl http://localhost:8000/health
```

## 🎨 UI Theme

VeriLoan features a modern cyberpunk-inspired dark theme:
- **Background**: `#1a1c1b` (Dark black)
- **Primary**: `#59ff00` (Neon green) with glow effects
- **Secondary**: `#555D58` (Gray) for disabled/completed states
- **Card backgrounds**: `#2a2c2b` and `#1f2120`
- **Modal popups** for report display

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Useful Links

- [Concordium Documentation](https://developer.concordium.software/)
- [Concordium Browser Wallet](https://chrome.google.com/webstore/detail/concordium-wallet/mnnkpffndmickbiakofclnpoiajlegmg)
- [Wagmi Documentation](https://wagmi.sh/)
- [Hasura GraphQL](https://hasura.io/)

## 📊 Project Status

This is a proof-of-concept demonstration for cross-chain identity verification in DeFi. For production use, additional security measures, comprehensive testing, and security audits are required.

---

**Built with ❤️ for cross-chain DeFi innovation**
