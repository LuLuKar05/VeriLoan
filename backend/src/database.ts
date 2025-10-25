/**
 * VeriLoan Database - Wallet Pairing Storage
 * Stores cryptographic hash of Concordium-EVM wallet pairs in MongoDB
 */

import { createHash } from 'crypto';
import { MongoClient, Db, Collection } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'veriloan';

let client: MongoClient | null = null;
let db: Db | null = null;
let pairingsCollection: Collection<WalletPairing> | null = null;

interface WalletPairing {
  pairingId: string; // Cryptographic hash of concordiumAddress
  concordiumAddress: string;
  evmAddresses: string[]; // Array of paired EVM addresses
  verifiedAttributes: {
    firstName?: string;
    lastName?: string;
    nationality?: string;
    ageVerified?: boolean;
  };
  termsAcceptance: {
    concordium: boolean;
    evm: string[]; // List of EVM addresses that accepted terms
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Initialize MongoDB connection
 */
export async function initDatabase(): Promise<void> {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    pairingsCollection = db.collection<WalletPairing>('pairings');

    // Create indexes for efficient queries
    await pairingsCollection.createIndex({ pairingId: 1 }, { unique: true });
    await pairingsCollection.createIndex({ concordiumAddress: 1 });
    await pairingsCollection.createIndex({ evmAddresses: 1 });

    console.log('✅ MongoDB connected successfully');
    console.log(`   Database: ${DB_NAME}`);
    console.log(`   Collection: pairings`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Close MongoDB connection
 */
export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

/**
 * Generate a deterministic pairing ID from Concordium address
 */
export function generatePairingId(concordiumAddress: string): string {
  return createHash('sha256')
    .update(`veriloan:${concordiumAddress.toLowerCase()}`)
    .digest('hex');
}

/**
 * Create or update a wallet pairing
 */
export async function createOrUpdatePairing(
  concordiumAddress: string,
  evmAddress: string,
  attributes?: {
    firstName?: string;
    lastName?: string;
    nationality?: string;
    ageVerified?: boolean;
  }
): Promise<WalletPairing> {
  if (!pairingsCollection) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }

  const pairingId = generatePairingId(concordiumAddress);
  const normalizedEvmAddress = evmAddress.toLowerCase();

  const existing = await pairingsCollection.findOne({ pairingId });

  if (existing) {
    // Update existing pairing - add EVM address if not already present
    const updates: any = {
      updatedAt: new Date(),
    };

    if (!existing.evmAddresses.includes(normalizedEvmAddress)) {
      updates.evmAddresses = [...existing.evmAddresses, normalizedEvmAddress];
    }

    // Update attributes if provided
    if (attributes) {
      updates.verifiedAttributes = {
        ...existing.verifiedAttributes,
        ...attributes,
      };
    }

    await pairingsCollection.updateOne(
      { pairingId },
      { $set: updates }
    );

    return {
      ...existing,
      ...updates,
    };
  } else {
    // Create new pairing
    const newPairing: WalletPairing = {
      pairingId,
      concordiumAddress,
      evmAddresses: [normalizedEvmAddress],
      verifiedAttributes: attributes || {},
      termsAcceptance: {
        concordium: false,
        evm: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await pairingsCollection.insertOne(newPairing as any);
    return newPairing;
  }
}

/**
 * Mark terms acceptance for Concordium wallet
 */
export async function markConcordiumTermsAccepted(concordiumAddress: string): Promise<boolean> {
  if (!pairingsCollection) {
    throw new Error('Database not initialized');
  }

  const pairingId = generatePairingId(concordiumAddress);
  
  const result = await pairingsCollection.updateOne(
    { pairingId },
    {
      $set: {
        'termsAcceptance.concordium': true,
        updatedAt: new Date(),
      },
    }
  );

  return result.modifiedCount > 0;
}

/**
 * Mark terms acceptance for EVM wallet
 */
export async function markEvmTermsAccepted(
  concordiumAddress: string,
  evmAddress: string
): Promise<boolean> {
  if (!pairingsCollection) {
    throw new Error('Database not initialized');
  }

  const pairingId = generatePairingId(concordiumAddress);
  const normalizedEvmAddress = evmAddress.toLowerCase();

  const result = await pairingsCollection.updateOne(
    { pairingId },
    {
      $addToSet: { 'termsAcceptance.evm': normalizedEvmAddress },
      $set: { updatedAt: new Date() },
    }
  );

  return result.modifiedCount > 0;
}

/**
 * Get pairing by Concordium address
 */
export async function getPairingByConcordium(concordiumAddress: string): Promise<WalletPairing | null> {
  if (!pairingsCollection) {
    throw new Error('Database not initialized');
  }

  const pairingId = generatePairingId(concordiumAddress);
  return await pairingsCollection.findOne({ pairingId });
}

/**
 * Get pairing by EVM address
 */
export async function getPairingByEvm(evmAddress: string): Promise<WalletPairing | null> {
  if (!pairingsCollection) {
    throw new Error('Database not initialized');
  }

  const normalizedEvmAddress = evmAddress.toLowerCase();
  return await pairingsCollection.findOne({
    evmAddresses: normalizedEvmAddress,
  });
}

/**
 * Check if EVM address is already paired
 */
export async function isEvmAddressPaired(evmAddress: string): Promise<boolean> {
  const pairing = await getPairingByEvm(evmAddress);
  return pairing !== null;
}

/**
 * Get all pairings for a Concordium address
 */
export async function getAllEvmAddresses(concordiumAddress: string): Promise<string[]> {
  const pairing = await getPairingByConcordium(concordiumAddress);
  return pairing ? pairing.evmAddresses : [];
}

/**
 * Get statistics
 */
export async function getStats() {
  if (!pairingsCollection) {
    throw new Error('Database not initialized');
  }

  const totalPairings = await pairingsCollection.countDocuments();
  const pairings = await pairingsCollection.find().toArray();

  let totalEvmAddresses = 0;
  let totalTermsAccepted = 0;

  for (const pairing of pairings) {
    totalEvmAddresses += pairing.evmAddresses.length;
    if (pairing.termsAcceptance.concordium) {
      totalTermsAccepted++;
    }
  }

  return {
    totalPairings,
    totalEvmAddresses,
    totalTermsAccepted,
    averageEvmPerConcordium: totalPairings > 0 ? (totalEvmAddresses / totalPairings).toFixed(2) : '0',
  };
}

/**
 * Get all pairings (for admin/debugging)
 */
export async function getAllPairings(): Promise<WalletPairing[]> {
  if (!pairingsCollection) {
    throw new Error('Database not initialized');
  }

  return await pairingsCollection.find().toArray();
}
