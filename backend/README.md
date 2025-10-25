# VeriLoan Backend - Concordium ZKP Verification Service

Backend service for verifying Concordium Zero-Knowledge Proofs and managing cross-chain identity attestations.

## Features

- ✅ **Concordium ZKP Verification** - Cryptographic verification of identity proofs
- ✅ **Challenge Generation** - Secure nonce generation to prevent replay attacks
- ✅ **Unique User ID Extraction** - dApp-specific user identifiers
- ✅ **Attribute Extraction** - Parse revealed identity attributes
- ✅ **EVM Integration** - Verify signatures from Ethereum wallets
- ✅ **RESTful API** - Easy integration with frontend applications

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update environment variables:
```env
PORT=8000
NODE_ENV=development
CONCORDIUM_NODE_URL=https://grpc.testnet.concordium.com
CONCORDIUM_NETWORK=testnet
ALLOWED_ORIGINS=http://localhost:3000
```

## Development

Start the development server with hot reload:

```bash
npm run dev
```

## Production

Build and start the production server:

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```http
GET /health
```

Returns server health status.

### Generate Challenge
```http
POST /api/challenge
```

Generates a unique challenge string for ZKP requests.

**Response:**
```json
{
  "success": true,
  "sessionId": "uuid-here",
  "challenge": "VeriLoan-timestamp-random",
  "expiresIn": 300
}
```

### Verify Identity
```http
POST /api/verify-identity
```

Verifies Concordium ZKP and EVM signature.

**Request Body:**
```json
{
  "concordiumProof": { ... },
  "concordiumAddress": "3kBx2h5Y...",
  "evmSignature": "0x123...",
  "evmAddress": "0xabc...",
  "sessionId": "uuid-from-challenge"
}
```

**Response:**
```json
{
  "success": true,
  "verification": {
    "concordium": {
      "verified": true,
      "uniqueUserId": "user-id",
      "address": "3kBx2h5Y...",
      "revealedAttributes": {
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    "evm": {
      "verified": true,
      "address": "0xabc...",
      "signature": "0x123..."
    }
  }
}
```

## Architecture

```
backend/
├── src/
│   ├── index.ts         # Express server & API endpoints
│   ├── verifier.ts      # Concordium ZKP verification logic
│   └── types.ts         # TypeScript type definitions
├── dist/                # Compiled JavaScript
├── .env                 # Environment configuration
├── package.json
└── tsconfig.json
```

## Verification Flow

1. **Frontend requests challenge** → `POST /api/challenge`
2. **Frontend gets ZKP from wallet** (using challenge)
3. **Frontend sends proof to backend** → `POST /api/verify-identity`
4. **Backend verifies proof**:
   - Validates challenge
   - Verifies cryptographic signatures
   - Extracts unique user ID
   - Extracts revealed attributes
5. **Backend returns verification result**

## Security Features

- ✅ Challenge-response to prevent replay attacks
- ✅ Challenge expiration (5 minutes)
- ✅ CORS protection
- ✅ Request size limits
- ✅ Input validation
- ✅ Comprehensive error handling

## Technologies

- **Node.js** - Runtime
- **TypeScript** - Type safety
- **Express** - Web framework
- **@concordium/web-sdk** - Concordium blockchain SDK
- **tsx** - TypeScript execution

## License

MIT
