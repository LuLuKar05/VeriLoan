# 🔍 Enhanced Debugging Instructions

## What to Do Next

1. **Clear your database again** (since current data has no attributes):
   ```bash
   cd backend
   npm run clear-db
   ```
   Type `yes` to confirm.

2. **Start the backend** (watch the logs carefully):
   ```bash
   cd backend
   npm run dev
   ```

3. **In another terminal, start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Complete verification flow**:
   - Connect Concordium wallet
   - Connect MetaMask
   - Click "Verify Identity"
   - Approve ZKP request in Concordium wallet
   - Sign with MetaMask

5. **Watch the backend terminal** - You'll now see VERY detailed logs:

## What the Logs Should Show

### Good Case (Attributes Found):
```
🔍 Checking proof format...
   isModernFormat: false
   Has proof array: true
🔍 Proof structure (truncated): { "proof": [{ ... }] }

📄 Using LEGACY format extraction
📋 Extracting attributes from proof data...
   Statement items: 4
   Has revealedAttributes?: true
   Revealed attributes keys: [ 'firstName', 'lastName', 'nationality' ]
   Full revealedAttributes: {
     "firstName": "John",
     "lastName": "Doe",
     "nationality": "US"
   }
   Processing statement items...
   → Statement type: RevealAttribute, attributeTag: firstName
      Checking for revealed value in proofData.revealedAttributes['firstName']
   ✓ Found revealed attribute: firstName = John
   → Statement type: RevealAttribute, attributeTag: lastName
      Checking for revealed value in proofData.revealedAttributes['lastName']
   ✓ Found revealed attribute: lastName = Doe
   → Statement type: RevealAttribute, attributeTag: nationality
      Checking for revealed value in proofData.revealedAttributes['nationality']
   ✓ Found revealed attribute: nationality = US
   
📊 Final extracted attributes: { firstName: 'John', lastName: 'Doe', nationality: 'US', ... }
✅ Verification result: { isValid: true, hasAttributes: true, ... }
💾 Storing attributes in database: { firstName: 'John', lastName: 'Doe', ... }
```

### Bad Case (Attributes Missing):
```
📋 Extracting attributes from proof data...
   Statement items: 4
   Has revealedAttributes?: false
   Revealed attributes keys: []
   Processing statement items...
   → Statement type: RevealAttribute, attributeTag: firstName
      Checking for revealed value in proofData.revealedAttributes['firstName']
   ✗ No value found for firstName in revealedAttributes
```

## What to Share

After you complete the verification, **copy the entire backend log output** and share it. The enhanced logging will show us:

1. ✅ Is the proof in modern or legacy format?
2. ✅ Does the proof have a `revealedAttributes` object?
3. ✅ What keys are in `revealedAttributes`?
4. ✅ What statement types are being processed?
5. ✅ Are attribute values being found and extracted?
6. ✅ What's the final extracted attributes object?

This will help identify the exact issue!

## Most Likely Issues

### Issue 1: Concordium Wallet Not Revealing Attributes
If logs show `Has revealedAttributes?: false`, it means the Concordium wallet didn't include the revealed attributes in the proof response. This could be:
- Wallet version issue
- Wrong network (mainnet vs testnet)
- User didn't approve attribute revelation

### Issue 2: Wrong Proof Structure
If the proof structure looks different from expected, the wallet might be using a newer format we haven't handled yet. The full proof structure log will show this.

### Issue 3: Attribute Tags Mismatch
If statement items show different attribute tag names, we'll need to update the mapping.

## Quick Test

You can also test with curl to see the raw proof:
```bash
# After verification, check what's in MongoDB:
npm run inspect-db
```

Then check the backend logs for the verification that just happened.
