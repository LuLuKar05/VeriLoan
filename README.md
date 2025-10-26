# VeriLoan 🔐

> **Cross-Chain Identity Verification for DeFi**  
> Privacy-preserving identity verification using Concordium's Zero-Knowledge Proofs and Ethereum wallet integration.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#️-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Security](#-security)
- [Technologies](#-technologies)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🌟 Overview

**VeriLoan** is a decentralized application (dApp) that enables secure, privacy-preserving identity verification across blockchain ecosystems. By leveraging **Concordium's Zero-Knowledge Proofs (ZKP)** and **Ethereum Virtual Machine (EVM)** wallet integration, VeriLoan creates trustworthy borrower profiles for DeFi lending platforms.

### Why VeriLoan?

- **Privacy-First**: Verify identity without revealing sensitive personal information
- **Cross-Chain**: Link Concordium identity credentials with EVM addresses
- **Regulatory Compliant**: Meets KYC/AML requirements while preserving user privacy
- **DeFi Ready**: Enables under-collateralized lending with verified identities
- **Secure**: Cryptographic proof validation with challenge-response authentication

---

## 🎯 Features

- ✅ **Concordium Identity Integration** - Real browser wallet connection with ZKP support
- ✅ **EVM Wallet Support** - MetaMask and WalletConnect integration via Wagmi
- ✅ **Zero-Knowledge Proofs** - Privacy-preserving identity verification
- ✅ **Selective Disclosure** - Users control which attributes to reveal
- ✅ **Cross-Chain Verification** - Links Concordium identity with EVM addresses
- ✅ **Backend Verification** - Server-side cryptographic proof validation
- ✅ **DeFi Lending Reports** - Aggregate lending history from multiple protocols
- ✅ **Secure Authentication** - Challenge-response system prevents replay attacks
- ✅ **Modern UI** - Cyberpunk-themed dark interface with neon accents

---

## 🏗️ Architecture

```
VeriLoan/
├── frontend/                    # React + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx                           # Main application
│   │   ├── ReportComponent.tsx               # User report generator
│   │   ├── TermsAndConditionsCombined.tsx    # T&C modal
│   │   └── main.tsx                          # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── index.ts                          # API server
│   │   ├── verifier.ts                       # ZKP verification logic
│   │   ├── database.ts                       # MongoDB connection
│   │   ├── hasura-client.ts                  # Hasura GraphQL client
│   │   └── routes/
│   ├── package.json
│   └── tsconfig.json
│
├── envio-server/                # Envio indexer (optional)
│
└── package.json                 # Monorepo root
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v9.0.0 or higher, comes with Node.js)
- **MongoDB** (v6.0 or higher) - [Installation Guide](https://docs.mongodb.com/manual/installation/)
  - OR use Docker: `docker run -d -p 27017:27017 --name veriloan-mongodb mongo:latest`

### Browser Extensions

- **[Concordium Browser Wallet](https://chrome.google.com/webstore/detail/concordium-wallet/mnnkpffndmickbiakofclnpoiajlegmg)** - For Concordium testnet
- **[MetaMask](https://metamask.io/)** - For EVM wallet integration

### Optional

- **Docker** (for containerized MongoDB)
- **Git** - For cloning the repository

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/LuLuKar05/VeriLoan.git
cd VeriLoan
```

### Step 2: Install Dependencies

#### Option A: Install All Dependencies at Once (Recommended)

```bash
npm install
```

This will install dependencies for the root, frontend, and backend workspaces automatically.

#### Option B: Install Manually

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

---

## ⚙️ Configuration

### Backend Configuration

1. **Navigate to the backend directory:**

```bash
cd backend
```

2. **Create environment file:**

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

3. **Edit `.env` file with your configuration:**

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/veriloan

# Server Configuration
PORT=8000
NODE_ENV=development

# Hasura Configuration (Optional - for DeFi data)
HASURA_ENDPOINT=https://your-hasura-endpoint.hasura.app/v1/graphql
HASURA_ADMIN_SECRET=your-admin-secret

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Session Configuration
SESSION_EXPIRY=300
```

### Frontend Configuration

The frontend is configured through `vite.config.ts`. Default settings work out of the box, but you can customize:

- API endpoint (defaults to `http://localhost:8000`)
- Port (defaults to `3000`)

---

## 🎮 Running the Application

### Option 1: Run Both Frontend and Backend Together (Recommended)

From the root directory:

```bash
npm run dev
```

This starts:
- **Backend** on http://localhost:8000
- **Frontend** on http://localhost:3000

### Option 2: Run Services Individually

#### Start Backend Only

```bash
# From root
npm run dev:backend

# OR from backend directory
cd backend
npm run dev
```

#### Start Frontend Only

```bash
# From root
npm run dev:frontend

# OR from frontend directory
cd frontend
npm run dev
```

### Step 3: Access the Application

1. Open your browser and navigate to **http://localhost:3000**
2. Ensure both **Concordium Browser Wallet** and **MetaMask** extensions are installed
3. Connect your wallets and start verifying!

---

## 🔧 Development Commands

### Root Level Commands

```bash
npm run dev              # Start both frontend & backend concurrently
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only
npm run build            # Build all workspaces
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only
npm run lint             # Lint frontend code
npm run install-all      # Install all workspace dependencies
```

### Frontend Commands

```bash
cd frontend
npm run dev              # Start dev server (port 3000)
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # ESLint check
```

### Backend Commands

```bash
cd backend
npm run dev              # Start dev server (port 8000)
npm run build            # Compile TypeScript to JavaScript
npm start                # Run compiled code (production)
npm run lint             # ESLint check
npm run inspect-db       # Inspect MongoDB database contents
npm run clear-db         # Clear MongoDB database
```

### MongoDB Management (with Docker)

```bash
cd backend
npm run mongodb:start    # Start MongoDB container
npm run mongodb:stop     # Stop MongoDB container
npm run mongodb:logs     # View MongoDB logs
npm run mongodb:shell    # Access MongoDB shell
```

---

## 📋 How It Works

### Verification Flow

1. **User Connects Concordium Wallet**
   - Frontend detects browser wallet extension
   - Calls `getMostRecentlySelectedAccount()` or `connect()`
   - Retrieves real account address

2. **User Connects EVM Wallet**
   - MetaMask popup appears
   - User approves connection
   - Frontend stores EVM address

3. **User Initiates Verification**
   - Frontend requests challenge from backend
   - Backend generates unique session ID and challenge
   - Challenge expires in 5 minutes

4. **ZKP Generation**
   - Frontend requests ZKP from Concordium wallet
   - User approves in wallet extension
   - Wallet returns verifiable presentation with:
     - Revealed attributes (name, nationality, etc.)
     - Range proofs (e.g., age ≥ 18)
     - Set membership proofs

5. **EVM Signature**
   - Frontend requests signature from MetaMask
   - User signs ownership proof message
   - Returns cryptographic signature

6. **Backend Verification**
   - Validates ZKP cryptographically
   - Checks challenge to prevent replay attacks
   - Extracts unique user ID
   - Extracts revealed attributes
   - Verifies EVM signature
   - Stores verified pairing in MongoDB

7. **Generate Report** (Optional)
   - User can generate comprehensive lending report
   - Backend fetches:
     - User identity from MongoDB
     - DeFi lending data from Hasura GraphQL
   - Aggregates loan history, repayments, liquidations
   - Returns formatted report with metrics

---

---

## � API Documentation

### Endpoints

#### `GET /health`

Health check endpoint to verify the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-10-26T12:34:56.789Z"
}
```

---

#### `POST /api/challenge`

Generate a verification challenge for the user.

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "challenge": "VeriLoan-1729945696-abc123",
  "expiresIn": 300
}
```

**Notes:**
- Challenge is valid for 5 minutes
- Session ID must be used in subsequent verification request
- One-time use only (prevents replay attacks)

---

#### `POST /api/verify-identity`

Verify ZKP and EVM signature.

**Request Body:**
```json
{
  "concordiumProof": {
    "type": "web3IdProof",
    "value": { ... }
  },
  "concordiumAddress": "3kBx2h5Y...",
  "evmSignature": "0x123...",
  "evmAddress": "0xabc...",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response:**
```json
{
  "success": true,
  "verification": {
    "concordium": {
      "verified": true,
      "uniqueUserId": "user_123",
      "revealedAttributes": {
        "firstName": "John",
        "nationality": "US"
      }
    },
    "evm": {
      "verified": true,
      "address": "0xabc..."
    }
  }
}
```

**Error Response:**
```json
{
  "error": "Invalid or expired session",
  "success": false
}
```

---

#### `POST /api/report/:concordiumAddress`

Generate comprehensive user report with DeFi lending history.

**Parameters:**
- `concordiumAddress` - User's Concordium wallet address

**Response:**
```json
{
  "identity": {
    "concordiumAddress": "3kBx2h5Y...",
    "uniqueUserId": "user_123",
    "attributes": { ... }
  },
  "pairedWallets": [
    { "evmAddress": "0xabc...", "verifiedAt": "2024-10-26T..." }
  ],
  "defiData": {
    "loans": [ ... ],
    "repayments": [ ... ],
    "liquidations": [ ... ],
    "metrics": {
      "totalBorrowed": "100000",
      "totalRepaid": "95000",
      "activeLoans": 2
    }
  }
}
```

---

## 🔐 Security

VeriLoan implements multiple security layers to protect user data and prevent attacks:

### Security Features

- ✅ **Challenge-Response Authentication** - Prevents unauthorized verification attempts
- ✅ **One-Time Use Challenges** - Each challenge expires after 5 minutes and can only be used once
- ✅ **CORS Protection** - Restricts API access to authorized frontend origins
- ✅ **Input Validation** - All API inputs are validated and sanitized
- ✅ **Cryptographic Proof Verification** - ZKP and signatures verified server-side
- ✅ **Secure Wallet Connections** - Direct browser extension integration (no private keys transmitted)
- ✅ **Session Management** - Secure session handling with expiration
- ✅ **MongoDB Secure Storage** - Encrypted database connections

### Best Practices

- Never share your private keys or seed phrases
- Always verify the application URL before connecting wallets
- Review requested permissions in wallet popups
- Use strong passwords for wallet access
- Keep browser extensions updated

---

## 🔧 Technologies

### Frontend Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18.3.1 |
| **TypeScript** | Type Safety | 5.5.3 |
| **Vite** | Build Tool & Dev Server | 5.3.4 |
| **Wagmi** | EVM Wallet Integration | 1.4.13 |
| **Viem** | Ethereum Utilities | 1.21.4 |
| **@concordium/browser-wallet-api-helpers** | Concordium SDK | 3.0.1 |
| **@concordium/react-components** | React Components | 0.6.1 |
| **Ethers.js** | Ethereum Library | 6.13.2 |

### Backend Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime Environment | 18+ |
| **Express** | Web Framework | 4.18.2 |
| **TypeScript** | Type Safety | 5.3.3 |
| **MongoDB** | Database | 6.20.0 |
| **@concordium/web-sdk** | ZKP Verification | 7.5.1 |
| **Ethers.js** | Signature Verification | 6.15.0 |
| **tsx** | TypeScript Execution | 4.7.0 |

### Development Tools

- **ESLint** - Code linting and quality
- **Concurrently** - Run multiple dev servers
- **Docker** - MongoDB containerization (optional)

### Data Sources

- **Hasura GraphQL** - Indexed DeFi lending events
- **Envio** - Blockchain data indexer (optional)

---

## 🧪 Testing

### Backend Testing

```bash
# Navigate to backend
cd backend

# Start the development server
npm run dev

# In another terminal, test the health endpoint
curl http://localhost:8000/health

# Check MongoDB connection
npm run inspect-db
```

### Frontend Testing

```bash
# Navigate to frontend
cd frontend

# Run linting
npm run lint

# Start dev server and test in browser
npm run dev
```

### Integration Testing

1. Start both frontend and backend:
   ```bash
   npm run dev
   ```

2. Open browser and navigate to http://localhost:3000

3. Install browser extensions (Concordium Wallet & MetaMask)

4. Test wallet connections and verification flow

---

## 📦 Building for Production

### Build All Services

```bash
# From root directory
npm run build
```

This compiles:
- Frontend → `frontend/dist/`
- Backend → `backend/dist/`

### Build Individually

```bash
# Build frontend only
npm run build:frontend

# Build backend only
npm run build:backend
```

### Running Production Build

#### Frontend

```bash
cd frontend
npm run preview
# Access at http://localhost:4173
```

#### Backend

```bash
cd backend
npm run build
npm start
# Runs on configured PORT (default: 8000)
```

### Deployment Checklist

- [ ] Update environment variables for production
- [ ] Configure MongoDB with authentication
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure CORS for production domain
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Review and test all security measures
- [ ] Perform security audit

---

## 🎨 UI Theme

VeriLoan features a modern **cyberpunk-inspired dark theme**:

- **Background**: `#1a1c1b` - Deep dark black
- **Primary**: `#59ff00` - Neon green with glow effects
- **Secondary**: `#555D58` - Gray for disabled states
- **Card Backgrounds**: `#2a2c2b` and `#1f2120`
- **Modal Popups**: Overlay with blur effect
- **Typography**: Clean, modern fonts with high contrast

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### How to Contribute

1. **Fork the Repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/VeriLoan.git
   cd VeriLoan
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Your Changes**
   - Write clean, documented code
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Add amazing feature"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Describe your changes clearly

### Code Style Guidelines

- Use TypeScript for type safety
- Follow ESLint configuration
- Write descriptive commit messages
- Add comments for complex logic
- Keep functions small and focused

### Reporting Issues

Found a bug? Have a feature request?

1. Check if the issue already exists
2. Open a new issue with detailed description
3. Include steps to reproduce (for bugs)
4. Add relevant labels

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 VeriLoan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🔗 Useful Links

### Documentation

- [Concordium Developer Portal](https://developer.concordium.software/)
- [Concordium Web SDK Docs](https://developer.concordium.software/concordium-node-sdk-js/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)

### Browser Extensions

- [Concordium Browser Wallet](https://chrome.google.com/webstore/detail/concordium-wallet/mnnkpffndmickbiakofclnpoiajlegmg)
- [MetaMask](https://metamask.io/)

### Related Projects

- [Hasura GraphQL Engine](https://hasura.io/)
- [Envio Indexer](https://envio.dev/)

---

## � Support

### Get Help

- **Documentation**: Check this README and inline code comments
- **Issues**: [GitHub Issues](https://github.com/LuLuKar05/VeriLoan/issues)
- **Discussions**: [GitHub Discussions](https://github.com/LuLuKar05/VeriLoan/discussions)

### Community

- Star ⭐ the repository if you find it helpful
- Share feedback and suggestions
- Report bugs and request features
- Contribute code improvements

---

## 📊 Project Status

**Current Status**: 🚧 Proof of Concept / Development

This is a **demonstration project** showcasing cross-chain identity verification capabilities. 

### Production Readiness Checklist

For production deployment, ensure:

- [ ] Comprehensive security audit
- [ ] Extensive testing (unit, integration, e2e)
- [ ] Production-grade error handling
- [ ] Monitoring and alerting setup
- [ ] Rate limiting and DDoS protection
- [ ] Data backup and recovery procedures
- [ ] Compliance verification (GDPR, KYC/AML)
- [ ] Professional legal review
- [ ] Performance optimization
- [ ] Load testing

---

## 🙏 Acknowledgments

- **Concordium Foundation** - For Zero-Knowledge Proof technology
- **Ethereum Community** - For EVM ecosystem tools
- **Open Source Contributors** - For the amazing libraries used

---

<div align="center">

**Built with ❤️ for cross-chain DeFi innovation**

[⬆ Back to Top](#veriloan-)

</div>
