# Concordium ZKP Attribute Extraction Fix

## Problem
When users verified their identity with Concordium ZKP, the revealed attributes (firstName, lastName, nationality) were showing as "N/A" in the generated report, even though the verification was successful.

## Root Cause
The verifier was extracting attributes from the Concordium proof but not properly mapping them to the expected schema. The issue was in `/backend/src/verifier.ts`:

1. **Modern format**: Was storing `item.attribute` as both key and value (incorrect)
2. **Legacy format**: Was correctly reading from `proofData.revealedAttributes` but needed better attribute tag mapping
3. **Age verification**: Was not setting the `ageVerified` flag when processing date of birth range proofs

## Solution

### 1. Enhanced Attribute Mapping
Added explicit mapping for Concordium attribute tags to our database schema:

```typescript
const tagMapping: Record<string, string> = {
  'firstName': 'firstName',
  'lastName': 'lastName',
  'nationality': 'nationality',
  'countryOfResidence': 'nationality', // Alternative tag
  'nationalIdNo': 'nationalIdNo',
  // ... etc
};
```

### 2. Fixed Modern Format Extraction
Changed from storing the attribute tag as both key and value:
```typescript
// Before (wrong)
revealedAttributes[item.attribute] = item.attribute;

// After (correct)
const attributeValue = item.attribute;
const mappedKey = tagMapping[item.attributeTag || item.attribute] || item.attribute;
revealedAttributes[mappedKey] = attributeValue;
```

### 3. Added Age Verification Flag
When processing date of birth range proofs, now properly sets the `ageVerified` flag:

```typescript
if (item.type === 'AttributeInRange' && item.attributeTag) {
  revealedAttributes[`${item.attributeTag}_verified`] = true;
  
  // Special handling for date of birth (age verification)
  if (item.attributeTag === 'dob') {
    revealedAttributes['ageVerified'] = true;
  }
}
```

### 4. Added Debug Logging
Enhanced logging to help troubleshoot attribute extraction:

```typescript
console.log('📋 Extracting attributes from proof data...');
console.log('   Statement items:', proofData?.statement?.length || 0);
console.log('   Revealed attributes keys:', Object.keys(proofData?.revealedAttributes || {}));
console.log(`   ✓ Found revealed attribute: ${item.attributeTag} = ${attributeValue}`);
```

## Data Flow

### Verification Process:
1. **Frontend** → User approves ZKP request in Concordium wallet
2. **Concordium Wallet** → Returns proof with `revealedAttributes` object
3. **Backend Verifier** → Extracts and maps attributes to schema
4. **Database** → Stores mapped attributes in `verifiedAttributes` field
5. **Report Generation** → Reads from database and displays in UI

### Example Concordium Proof Structure:
```json
{
  "proof": [{
    "statement": [
      {
        "type": "RevealAttribute",
        "attributeTag": "firstName"
      },
      {
        "type": "RevealAttribute",
        "attributeTag": "lastName"
      },
      {
        "type": "RevealAttribute",
        "attributeTag": "nationality"
      },
      {
        "type": "AttributeInRange",
        "attributeTag": "dob",
        "lower": "19000101",
        "upper": "20071026"
      }
    ],
    "revealedAttributes": {
      "firstName": "John",
      "lastName": "Doe",
      "nationality": "US"
    }
  }]
}
```

### Database Storage:
```json
{
  "concordiumAddress": "3kBx2h5Y...",
  "verifiedAttributes": {
    "firstName": "John",
    "lastName": "Doe",
    "nationality": "US",
    "ageVerified": true
  }
}
```

### Report Display:
```json
{
  "userIdentity": {
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "nationality": "US",
    "ageVerified18Plus": true
  }
}
```

## Testing
To verify the fix works:

1. **Start the backend** (ensure MongoDB is running):
   ```bash
   npm run dev:backend
   ```

2. **Start the frontend**:
   ```bash
   npm run dev:frontend
   ```

3. **Complete verification flow**:
   - Connect Concordium wallet
   - Connect MetaMask
   - Verify identity (approve ZKP request)
   - Check backend logs for extracted attributes

4. **Generate report**:
   - Click "Generate User Report"
   - Verify that firstName, lastName, and nationality show actual values instead of "N/A"

## Expected Backend Logs
When verification succeeds, you should see:

```
📋 Extracting attributes from proof data...
   Statement items: 4
   Revealed attributes keys: [ 'firstName', 'lastName', 'nationality' ]
   ✓ Found revealed attribute: firstName = John
   ✓ Found revealed attribute: lastName = Doe
   ✓ Found revealed attribute: nationality = US
✅ Verification result: { isValid: true, hasAttributes: true, attributes: {...} }
✅ Wallet pairing created/updated
```

## Files Modified
1. `/backend/src/verifier.ts` - Enhanced attribute extraction and mapping
2. `/backend/src/index.ts` - Added verification result logging
3. This documentation file

## Notes
- The fix handles both modern and legacy Concordium proof formats
- Attribute mapping is extensible - add more tags to `tagMapping` as needed
- Age verification is automatically set when `dob` range proof is included
- All existing functionality remains unchanged
