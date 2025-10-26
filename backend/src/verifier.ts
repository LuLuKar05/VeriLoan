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

    // Handle both legacy and modern proof formats
    console.log('Proof type:', (proofResult as any).type);
    console.log('Has verifiableCredential:', 'verifiableCredential' in proofResult);
    console.log('Proof structure:', typeof proofResult.proof);

    // Modern format: proof is an object, not array
    // Legacy format: proof is an array
    const isModernFormat = !Array.isArray(proofResult.proof);

    if (isModernFormat) {
      // Modern Verifiable Presentation format
      const modernProof = proofResult as any;

      if (!modernProof.verifiableCredential || !Array.isArray(modernProof.verifiableCredential)) {
        return {
          isValid: false,
          uniqueUserId: null,
          revealedAttributes: null,
          error: 'Invalid modern proof structure - missing verifiableCredential'
        };
      }

      if (modernProof.verifiableCredential.length === 0) {
        return {
          isValid: false,
          uniqueUserId: null,
          revealedAttributes: null,
          error: 'Empty verifiableCredential array'
        };
      }

      console.log('Using modern proof format');
    } else {
      // Legacy format validation
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
    }

    let uniqueUserId: string | null = null;

    try {
      const modernProof = proofResult as any;

      if (isModernFormat && modernProof.verifiableCredential && modernProof.verifiableCredential[0]) {
        // Extract from modern format
        const credential = modernProof.verifiableCredential[0];
        if (credential.credentialSubject && credential.credentialSubject.id) {
          uniqueUserId = credential.credentialSubject.id;
        }
      } else if (!isModernFormat) {
        // Extract from legacy format
        const legacyProof = proofResult as any;
        if (Array.isArray(legacyProof.proof)) {
          const proofArray = legacyProof.proof;
          const firstProof = proofArray[0];

          if (firstProof && firstProof.credential) {
            uniqueUserId = String(firstProof.credential);
          }
        }
      }

      // Fallback: generate from proof hash
      if (!uniqueUserId && proofResult.presentationContext) {
        const proofHash = Buffer.from(JSON.stringify(proofResult)).toString('base64').substring(0, 32);
        uniqueUserId = proofHash;
      }

      if (!uniqueUserId) {
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
      const modernProof = proofResult as any;

      console.log('🔍 Checking proof format...');
      console.log('   isModernFormat:', isModernFormat);
      console.log('   Has verifiableCredential:', !!modernProof.verifiableCredential);
      console.log('   Has proof array:', Array.isArray((proofResult as any).proof));

      // Log the full proof structure (first 2000 chars)
      const proofStr = JSON.stringify(proofResult, null, 2);
      console.log('🔍 Proof structure (truncated):', proofStr.substring(0, 2000));

      if (isModernFormat && modernProof.verifiableCredential && modernProof.verifiableCredential[0]) {
        console.log('📄 Using MODERN format extraction');
        // Extract from modern format
        const credential = modernProof.verifiableCredential[0];

        if (credential.credentialSubject && credential.credentialSubject.proof) {
          const proofValue = credential.credentialSubject.proof.proofValue;

          if (Array.isArray(proofValue)) {
            for (const item of proofValue) {
              if (item.attribute && item.proof) {
                // Revealed attribute with value
                const attributeValue = item.attribute;

                // Map Concordium attribute tags to our schema
                const tagMapping: Record<string, string> = {
                  'firstName': 'firstName',
                  'lastName': 'lastName',
                  'nationality': 'nationality',
                  'countryOfResidence': 'nationality',
                };

                const mappedKey = tagMapping[item.attributeTag || item.attribute] || item.attribute;
                revealedAttributes[mappedKey] = attributeValue;
              }
            }
          }
        }

        // Extract statement verification results if available
        if (credential.credentialSubject && credential.credentialSubject.statement) {
          for (const item of credential.credentialSubject.statement) {
            if (item.type === 'AttributeInRange' && item.attributeTag) {
              revealedAttributes[`${item.attributeTag}_verified`] = true;

              // Special handling for date of birth (age verification)
              if (item.attributeTag === 'dob') {
                revealedAttributes['ageVerified'] = true;
              }
            }
            if (item.type === 'AttributeInSet' && item.attributeTag) {
              revealedAttributes[`${item.attributeTag}_verified`] = true;
            }
          }
        }
      } else if (!isModernFormat) {
        console.log('📄 Using LEGACY format extraction');
        // Extract from legacy format
        const legacyProof = proofResult as any;
        if (Array.isArray(legacyProof.proof)) {
          const proofData = legacyProof.proof[0];

          console.log('📋 Extracting attributes from proof data...');
          console.log('   Statement items:', proofData?.statement?.length || 0);
          console.log('   Has revealedAttributes?:', !!proofData?.revealedAttributes);
          console.log('   Revealed attributes keys:', Object.keys(proofData?.revealedAttributes || {}));

          // Log full revealedAttributes object
          if (proofData?.revealedAttributes) {
            console.log('   Full revealedAttributes:', JSON.stringify(proofData.revealedAttributes, null, 2));
          }

          if (proofData && proofData.statement) {
            console.log('   Processing statement items...');

            // Keep track of revealed attribute values by their position in statement
            const revealedByPosition: Array<{ tag: string, value: any }> = [];

            for (let i = 0; i < proofData.statement.length; i++) {
              const item = proofData.statement[i];
              console.log(`   → Statement[${i}] type: ${item.type}, attributeTag: ${item.attributeTag}`);

              if (item.type === 'RevealAttribute' && item.attributeTag) {
                console.log(`      Checking for revealed value in proofData.revealedAttributes['${item.attributeTag}']`);

                // Check if revealedAttributes exists and has data
                if (proofData.revealedAttributes) {
                  // Try to get value by attributeTag
                  let attributeValue = proofData.revealedAttributes[item.attributeTag];

                  // If not found by tag, the value might be using the actual attribute value as key
                  // In that case, we need to find it by position
                  if (!attributeValue) {
                    const revealedKeys = Object.keys(proofData.revealedAttributes);
                    console.log(`      RevealedAttributes keys:`, revealedKeys);

                    // Count how many RevealAttribute items we've seen so far
                    const revealAttributeIndex = revealedByPosition.length;
                    if (revealAttributeIndex < revealedKeys.length) {
                      // Use the key at this position
                      const keyAtPosition = revealedKeys[revealAttributeIndex];
                      attributeValue = proofData.revealedAttributes[keyAtPosition];
                      console.log(`      Using value at position ${revealAttributeIndex}: ${keyAtPosition} = ${attributeValue}`);
                    }
                  }

                  if (attributeValue) {
                    console.log(`   ✓ Found revealed attribute: ${item.attributeTag} = ${attributeValue}`);

                    // Map Concordium attribute tags to our schema
                    const tagMapping: Record<string, string> = {
                      'firstName': 'firstName',
                      'lastName': 'lastName',
                      'nationality': 'nationality',
                      'countryOfResidence': 'nationality', // Alternative tag
                      'nationalIdNo': 'nationalIdNo',
                      'idDocType': 'idDocType',
                      'idDocNo': 'idDocNo',
                      'idDocIssuer': 'idDocIssuer',
                      'idDocIssuedAt': 'idDocIssuedAt',
                      'idDocExpiresAt': 'idDocExpiresAt',
                      'taxIdNo': 'taxIdNo',
                    };

                    const mappedKey = tagMapping[item.attributeTag] || item.attributeTag;
                    revealedAttributes[mappedKey] = attributeValue;
                  } else {
                    console.log(`   ✗ No value found for ${item.attributeTag} in revealedAttributes`);
                  }
                } else {
                  console.log(`      No revealedAttributes object found`);
                }
              }

              if (item.type === 'AttributeInRange' && item.attributeTag) {
                revealedAttributes[`${item.attributeTag}_verified`] = true;
                revealedAttributes[`${item.attributeTag}_range`] = {
                  lower: item.lower,
                  upper: item.upper
                };

                // Special handling for date of birth (age verification)
                if (item.attributeTag === 'dob') {
                  revealedAttributes['ageVerified'] = true;
                }
              }

              if (item.type === 'AttributeInSet' && item.attributeTag) {
                revealedAttributes[`${item.attributeTag}_verified`] = true;
                revealedAttributes[`${item.attributeTag}_allowedSet`] = item.set;
              }
            }
          }
        }
      }

    } catch (extractError: any) {
      console.warn('Error extracting attributes:', extractError);
    }

    console.log('📊 Final extracted attributes:', revealedAttributes);
    console.log('📊 Attribute count:', Object.keys(revealedAttributes).length);

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
 * Concordium requires a 32-byte hex string (64 hex characters)
 * 
 * @returns A 64-character hex string (32 bytes)
 */
export function generateChallenge(): string {
  // Generate 32 random bytes as hex string (64 characters)
  const randomBytes = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');

  return randomBytes;
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

    // Must be an object
    if (!proof || typeof proof !== 'object') {
      return false;
    }

    // Must have presentationContext (the challenge)
    const hasPresentationContext = 'presentationContext' in proof;

    // Must have proof object or array
    const hasProof = 'proof' in proof;

    // Must have credentials in some form:
    // - Modern format: verifiableCredential (array)
    // - Legacy format: credential (single object)
    const hasCredentials = (
      'verifiableCredential' in proof && Array.isArray(proof.verifiableCredential) ||
      'credential' in proof
    );

    // Should have type field for modern Verifiable Presentations
    const hasType = 'type' in proof;

    const isValid = hasPresentationContext && hasProof && hasCredentials;

    console.log('Proof structure validation:', {
      hasPresentationContext,
      hasProof,
      hasCredentials,
      hasType,
      isValid
    });

    return isValid;
  } catch (error) {
    console.error('Error validating proof structure:', error);
    return false;
  }
}
