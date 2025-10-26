/**
 * MongoDB Database Inspection Script
 * Run this to see what data is currently stored in your VeriLoan database
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'veriloan';

async function inspectDatabase() {
    const client = new MongoClient(MONGODB_URI);

    try {
        console.log('🔌 Connecting to MongoDB...');
        await client.connect();
        console.log('✅ Connected!');

        const db = client.db(DB_NAME);
        const pairingsCollection = db.collection('pairings');

        console.log('\n📊 Database: ' + DB_NAME);
        console.log('📁 Collection: pairings\n');

        const count = await pairingsCollection.countDocuments();
        console.log(`📈 Total pairings: ${count}\n`);

        if (count === 0) {
            console.log('⚠️  No pairings found. Complete a verification first.\n');
            return;
        }

        const pairings = await pairingsCollection.find({}).toArray();

        pairings.forEach((pairing, index) => {
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📋 Pairing #${index + 1}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`Pairing ID: ${pairing.pairingId}`);
            console.log(`Concordium Address: ${pairing.concordiumAddress}`);
            console.log(`EVM Addresses: ${pairing.evmAddresses.join(', ')}`);
            console.log(`\n🔐 Verified Attributes:`);

            const attrs = pairing.verifiedAttributes || {};
            console.log(`   firstName: ${attrs.firstName || '❌ MISSING'}`);
            console.log(`   lastName: ${attrs.lastName || '❌ MISSING'}`);
            console.log(`   nationality: ${attrs.nationality || '❌ MISSING'}`);
            console.log(`   ageVerified: ${attrs.ageVerified ? '✅ YES' : '❌ NO'}`);

            console.log(`\n📅 Timestamps:`);
            console.log(`   Created: ${pairing.createdAt}`);
            console.log(`   Updated: ${pairing.updatedAt}`);

            if (pairing.concordiumTermsAcceptedAt) {
                console.log(`   Concordium T&C: ${pairing.concordiumTermsAcceptedAt}`);
            }

            if (pairing.evmTermsAccepted) {
                console.log(`\n📜 EVM Terms Accepted:`);
                pairing.evmTermsAccepted.forEach((term: any) => {
                    console.log(`   ${term.evmAddress}: ${term.acceptedAt}`);
                });
            }
        });

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        // Check for issues
        const missingAttributes = pairings.filter(p => {
            const attrs = p.verifiedAttributes || {};
            return !attrs.firstName || !attrs.lastName || !attrs.nationality;
        });

        if (missingAttributes.length > 0) {
            console.log(`⚠️  WARNING: ${missingAttributes.length} pairing(s) have missing attributes!`);
            console.log(`   These records were created before the attribute extraction fix.`);
            console.log(`   Solution: Delete these records and re-verify to get fresh data.\n`);

            console.log(`   To delete old data, run:`);
            console.log(`   mongosh veriloan --eval "db.pairings.deleteMany({})"\n`);
        } else {
            console.log(`✅ All pairings have complete attribute data!\n`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('🔌 Disconnected from MongoDB\n');
    }
}

inspectDatabase().catch(console.error);
