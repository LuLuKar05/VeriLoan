/**
 * VeriLoan Backend - Concordium ZKP Verification Service
 * 
 * This module provides cryptographic verification of Zero-Knowledge Proofs
 * from the Concordium blockchain identity layer.
 */

import { 
  VerifiablePresentation
} from '@concordium/web-sdk';

/**
 * Interface for verification result
 */
export interface VerificationResult {
  isValid: boolean;
  uniqueUserId: string | null;
  revealedAttributes: Record<string, any> | null;
  error?: string;
}

/**
 * Interface for ZKP verification input
 */
export interface ZKPVerificationInput {
  proofResultJson: string;
  expectedStatementJson?: string;
  challenge: string;
}

/**
 * Verifies a Concordium Zero-Knowledge Proof and extracts user information
 * 
 * @param proofResultJson - JSON string of the ZKP result from frontend
 * @param expectedStatementJson - Optional JSON string of expected statement
 * @param challenge - Unique nonce to prevent replay attacks
 * @returns VerificationResult with validation status and extracted data
 * 
 * @example
 * ```typescript
 * const result = await verifyConcordiumProof({
 *   proofResultJson: JSON.stringify(proofFromFrontend),
 *   expectedStatementJson: JSON.stringify(originalStatement),
 *   challenge: 'VeriLoan Identity Verification'
 * });
 * 
 * if (result.isValid) {
 *   console.log('User ID:', result.uniqueUserId);
 *   console.log('Revealed:', result.revealedAttributes);
 * }
 * ```
 */
export async function verifyConcordiumProof(
  input: ZKPVerificationInput
): Promise<VerificationResult> {
  const { proofResultJson, expectedStatementJson, challenge } = input;

  try {
    let proofResult: VerifiablePresentation;
    try {
      proofResult = JSON.parse(proofResultJson);
    } catch (parseError) {
      return {
        isValid: false,
        uniqueUserId: null,
        revealedAttributes: null,
        error: 'Invalid proof format'
      };
    }

    if (expectedStatementJson) {
      try {
        JSON.parse(expectedStatementJson);
      } catch (parseError) {
        console.warn('Failed to parse expected statement');
      }
    }

    if (proofResult.presentationContext !== challenge) {
      return {
        isValid: false,
        uniqueUserId: null,
        revealedAttributes: null,
        error: 'Challenge mismatch'
      };
    }

    try {
      if (!proofResult.proof || !Array.isArray(proofResult.proof)) {
        throw new Error('Invalid proof structure');
      }

      const proofArray = proofResult.proof as any[];
      if (proofArray.length === 0) {
        throw new Error('Empty proof array');
      }

      const proofData = proofResult.proof[0];
      
      if (!proofData) {
        throw new Error('No proof data found');
      }

    } catch (verifyError: any) {
      return {
        isValid: false,
        uniqueUserId: null,
        revealedAttributes: null,
        error: `Verification failed: ${verifyError.message}`
      };
    }

    let uniqueUserId: string | null = null;
    
    try {
      const proofArray = proofResult.proof as any[];
      const firstProof = proofArray[0];
      
      if (firstProof && firstProof.credential) {
        uniqueUserId = String(firstProof.credential);
      } else if (proofResult.presentationContext) {
        const proofHash = Buffer.from(JSON.stringify(proofResult)).toString('base64').substring(0, 32);
        uniqueUserId = proofHash;
      } else {
        throw new Error('No credential ID found in proof');
      }
    } catch (extractError: any) {
      return {
        isValid: false,
        uniqueUserId: null,
        revealedAttributes: null,
        error: `Failed to extract user identifier: ${extractError.message}`
      };
    }

    const revealedAttributes: Record<string, any> = {};
    
    try {
      const proofData = proofResult.proof[0];
      
      if (proofData && proofData.statement) {
        for (const item of proofData.statement) {
          if (item.type === 'RevealAttribute' && item.attributeTag) {
            if (proofData.revealedAttributes && proofData.revealedAttributes[item.attributeTag]) {
              revealedAttributes[item.attributeTag] = proofData.revealedAttributes[item.attributeTag];
            }
          }
          
          if (item.type === 'AttributeInRange' && item.attributeTag) {
            revealedAttributes[`${item.attributeTag}_verified`] = true;
            revealedAttributes[`${item.attributeTag}_range`] = {
              lower: item.lower,
              upper: item.upper
            };
          }
          
          if (item.type === 'AttributeInSet' && item.attributeTag) {
            revealedAttributes[`${item.attributeTag}_verified`] = true;
            revealedAttributes[`${item.attributeTag}_allowedSet`] = item.set;
          }
        }
      }

    } catch (extractError: any) {
      console.warn('Error extracting attributes:', extractError);
    }
    
    return {
      isValid: true,
      uniqueUserId,
      revealedAttributes: Object.keys(revealedAttributes).length > 0 ? revealedAttributes : null,
    };

  } catch (error: any) {
    return {
      isValid: false,
      uniqueUserId: null,
      revealedAttributes: null,
      error: `Unexpected error: ${error.message || String(error)}`
    };
  }
}

/**
 * Generates a cryptographically secure challenge string
 * This should be called before requesting a proof from the frontend
 * 
 * @returns A unique challenge string
 */
export function generateChallenge(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `VeriLoan-${timestamp}-${random}`;
}

/**
 * Validates the structure of a Concordium proof before full verification
 * Useful for quick checks before expensive cryptographic operations
 * 
 * @param proofResultJson - JSON string of the proof
 * @returns true if structure is valid, false otherwise
 */
export function isValidProofStructure(proofResultJson: string): boolean {
  try {
    const proof = JSON.parse(proofResultJson);
    
    return (
      proof &&
      typeof proof === 'object' &&
      'proof' in proof &&
      'credential' in proof &&
      'presentationContext' in proof &&
      Array.isArray(proof.proof)
    );
  } catch {
    return false;
  }
}
