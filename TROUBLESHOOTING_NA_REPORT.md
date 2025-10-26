# Troubleshooting: "N/A" in Report

## Problem
The generated report still shows "N/A" for firstName, lastName, and nationality.

## Most Likely Cause: Old Data in MongoDB

The most common reason is that you have **old pairing data** in MongoDB that was created **before** the attribute extraction fix. This old data doesn't have the revealed attributes stored.

## Solution Steps

### Step 1: Check Your Database

Run this command to inspect what's currently stored:

```bash
cd backend
npm run inspect-db
```

This will show you:
- How many pairings exist
- What attributes are stored (or missing)
- Which records need to be refreshed

**Expected Output:**
```
📋 Pairing #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 Verified Attributes:
   firstName: ❌ MISSING
   lastName: ❌ MISSING
   nationality: ❌ MISSING
   
⚠️  WARNING: 1 pairing(s) have missing attributes!
   These records were created before the attribute extraction fix.
```

### Step 2: Clear Old Data

If you see missing attributes, delete the old data:

```bash
cd backend
npm run clear-db
```

Type `yes` when prompted. This will delete all pairings.

**Alternative (using MongoDB directly):**
```bash
mongosh veriloan --eval "db.pairings.deleteMany({})"
```

### Step 3: Re-verify Your Identity

Now that old data is cleared, go through the verification flow again:

1. **Start the servers:**
   ```bash
   npm run dev
   ```

2. **In the browser:**
   - Connect Concordium wallet
   - Connect MetaMask
   - Click "Verify Identity"
   - Approve the ZKP request in Concordium wallet
   - Sign with MetaMask

3. **Watch backend logs** - You should now see:
   ```
   🔍 Checking proof format...
   📄 Using LEGACY format extraction
   📋 Extracting attributes from proof data...
      ✓ Found revealed attribute: firstName = John
      ✓ Found revealed attribute: lastName = Doe
      ✓ Found revealed attribute: nationality = US
   📊 Final extracted attributes: { firstName: 'John', lastName: 'Doe', nationality: 'US', ... }
   ✅ Verification result: { isValid: true, hasAttributes: true, ... }
   💾 Storing attributes in database: { firstName: 'John', lastName: 'Doe', ... }
   ```

4. **Generate Report:**
   - Click "Generate User Report"
   - Backend logs should show:
     ```
     📋 Verified attributes from DB:
        - firstName: John
        - lastName: Doe
        - nationality: US
     ```
   - Report should now display actual values!

### Step 4: Verify the Fix

After re-verification, run the inspect script again:

```bash
cd backend
npm run inspect-db
```

**Expected Output (GOOD):**
```
🔐 Verified Attributes:
   firstName: John ✅
   lastName: Doe ✅
   nationality: US ✅
   ageVerified: ✅ YES

✅ All pairings have complete attribute data!
```

---

## Other Possible Issues

### Issue 1: Attributes Not Being Extracted

**Symptoms:**
- Backend logs show: `📊 Attribute count: 0`
- Verification succeeds but attributes are null

**Solution:**
Check the proof format detection logs:
```
🔍 Checking proof format...
   isModernFormat: false
   Has verifiableCredential: false
   Has proof array: true
```

The verifier should automatically detect the correct format. If it's using the wrong format, there might be an issue with the Concordium wallet SDK version.

### Issue 2: Concordium Wallet Not Revealing Attributes

**Symptoms:**
- Verification succeeds
- Backend logs show empty `revealedAttributes` object

**Solution:**
Make sure you're requesting attribute revelation in the frontend. Check `App.tsx`:

```typescript
const statement = [
  {
    type: 'RevealAttribute',
    attributeTag: 'firstName',
  },
  {
    type: 'RevealAttribute',
    attributeTag: 'lastName',
  },
  {
    type: 'RevealAttribute',
    attributeTag: 'nationality',
  },
  {
    type: 'AttributeInRange',
    attributeTag: 'dob',
    lower: '19000101',
    upper: '20071026', // Must be 18+
  },
];
```

### Issue 3: Wrong Attribute Tag Names

**Symptoms:**
- Logs show attributes being extracted but with different names
- Example: `countryOfResidence` instead of `nationality`

**Solution:**
The attribute mapping in `verifier.ts` handles common alternatives:

```typescript
const tagMapping: Record<string, string> = {
  'firstName': 'firstName',
  'lastName': 'lastName',
  'nationality': 'nationality',
  'countryOfResidence': 'nationality', // Alternative
};
```

If you see different tag names in the logs, add them to the mapping.

---

## Quick Checklist

✅ **MongoDB is running**
```bash
mongod --dbpath ./data
# or
docker ps | grep mongo
```

✅ **Backend is running with no errors**
```bash
npm run dev:backend
```

✅ **Frontend is running**
```bash
npm run dev:frontend
```

✅ **Old data has been cleared**
```bash
cd backend && npm run clear-db
```

✅ **Fresh verification completed**
- Approved ZKP request
- Backend logs show extracted attributes
- No errors in console

✅ **Report generated successfully**
- Backend logs show attributes from DB
- Frontend displays actual values

---

## Debug Commands

### View MongoDB Data Directly
```bash
mongosh veriloan
db.pairings.find().pretty()
```

### Check Backend Logs
Look for these key log messages:
1. `📋 Extracting attributes from proof data...`
2. `✓ Found revealed attribute: firstName = ...`
3. `💾 Storing attributes in database:`
4. `📋 Verified attributes from DB:`

### Test Backend API Directly
```bash
# Generate report (replace with your Concordium address)
curl -X POST http://localhost:8000/api/report/YOUR_CONCORDIUM_ADDRESS
```

---

## Still Not Working?

If after following all steps above you still see "N/A":

1. **Share your backend logs** - Copy the entire verification and report generation logs
2. **Check MongoDB data** - Run `npm run inspect-db` and share the output
3. **Check frontend console** - Look for any JavaScript errors
4. **Verify proof structure** - The logs will show what format is being used

The enhanced logging added in the fix will help identify exactly where the issue is occurring.
