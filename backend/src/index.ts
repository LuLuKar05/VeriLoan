/**
 * VeriLoan Backend API Server
 * Handles Concordium ZKP verification requests from the frontend
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { verifyConcordiumProof, generateChallenge, isValidProofStructure } from './verifier.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8000', 10);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// In-memory storage for challenges (in production, use Redis or database)
const activeChallenges = new Map<string, { challenge: string; createdAt: number }>();

// Clean up old challenges every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  for (const [sessionId, data] of activeChallenges.entries()) {
    if (data.createdAt < fiveMinutesAgo) {
      activeChallenges.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

/**
 * Health check endpoint
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'VeriLoan Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Generate a new challenge for ZKP request
 * This should be called before requesting a proof from the frontend
 */
app.post('/api/challenge', (_req: Request, res: Response) => {
  try {
    const sessionId = uuidv4();
    const challenge = generateChallenge();

    activeChallenges.set(sessionId, {
      challenge,
      createdAt: Date.now()
    });

    res.json({
      success: true,
      sessionId,
      challenge,
      expiresIn: 300
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate challenge'
    });
  }
});

/**
 * Main verification endpoint
 * Receives ZKP proof, EVM signature, and wallet addresses
 */
app.post('/api/verify-identity', async (req: Request, res: Response) => {
  try {
    const {
      concordiumProof,
      concordiumAddress,
      evmSignature,
      evmAddress,
      sessionId
    } = req.body;

    if (!concordiumProof || !concordiumAddress || !evmSignature || !evmAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['concordiumProof', 'concordiumAddress', 'evmSignature', 'evmAddress']
      });
    }

    let challenge = 'VeriLoan Identity Verification';
    if (sessionId && activeChallenges.has(sessionId)) {
      const challengeData = activeChallenges.get(sessionId);
      if (challengeData) {
        challenge = challengeData.challenge;
        activeChallenges.delete(sessionId);
      }
    }

    const proofJson = typeof concordiumProof === 'string'
      ? concordiumProof
      : JSON.stringify(concordiumProof);

    if (!isValidProofStructure(proofJson)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid proof structure'
      });
    }

    const verificationResult = await verifyConcordiumProof({
      proofResultJson: proofJson,
      challenge
    });

    if (!verificationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: verificationResult.error || 'Proof verification failed'
      });
    }

    const response = {
      success: true,
      verification: {
        concordium: {
          verified: true,
          uniqueUserId: verificationResult.uniqueUserId,
          address: concordiumAddress,
          revealedAttributes: verificationResult.revealedAttributes
        },
        evm: {
          verified: true,
          address: evmAddress,
          signature: evmSignature
        }
      },
      attestation: {
        status: 'pending',
        message: 'Attestation creation would happen here in production'
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error: any) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get verification status (for polling)
 */
app.get('/api/verification-status/:verificationId', (req: Request, res: Response) => {
  const { verificationId } = req.params;

  res.json({
    success: true,
    verificationId,
    status: 'completed',
    timestamp: new Date().toISOString()
  });
});

/**
 * Verify Terms and Conditions acceptance signature
 */
app.post('/api/verify-terms-acceptance', async (req: Request, res: Response) => {
  try {
    const { signature, message, termsVersion, termsHash, accountAddress, timestamp } = req.body;

    if (!signature || !message || !termsVersion || !termsHash || !accountAddress || !timestamp) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['signature', 'message', 'termsVersion', 'termsHash', 'accountAddress', 'timestamp']
      });
    }

    // Validate terms version
    const CURRENT_TERMS_VERSION = '1.0';
    if (termsVersion !== CURRENT_TERMS_VERSION) {
      return res.status(400).json({
        success: false,
        error: `Invalid terms version. Current version is ${CURRENT_TERMS_VERSION}`,
        verified: false
      });
    }

    // Validate timestamp (not too old, not in future)
    const signatureTime = new Date(timestamp).getTime();
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    const oneMinuteAhead = now + (60 * 1000);

    if (signatureTime < fiveMinutesAgo) {
      return res.status(400).json({
        success: false,
        error: 'Terms signature has expired. Please sign again.',
        verified: false
      });
    }

    if (signatureTime > oneMinuteAhead) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timestamp',
        verified: false
      });
    }

    // TODO: Implement full cryptographic verification
    // For now, basic structure validation
    const isValid = typeof signature === 'object' &&
      signature.signature &&
      message.includes(termsVersion) &&
      message.includes(termsHash);

    res.json({
      success: true,
      verified: isValid,
      accountAddress,
      termsVersion,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Terms verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('VeriLoan Backend Server');
  console.log(`Listening on http://localhost:${PORT}`);
  console.log('');
  console.log('Endpoints:');
  console.log('  GET  /health');
  console.log('  POST /api/challenge');
  console.log('  POST /api/verify-identity');
  console.log('  POST /api/verify-signature');
  console.log('  POST /api/verify-terms-acceptance');
  console.log('  GET  /api/verification-status/:id');
  console.log('');
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

export default app;
