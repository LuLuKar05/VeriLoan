/**
 * Clear MongoDB Database Script
 * Use this to delete old pairing data before re-verifying
 */

import { MongoClient } from 'mongodb';
import readline from 'readline';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'veriloan';

async function clearDatabase() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise<void>((resolve) => {
        rl.question('\n⚠️  This will DELETE ALL pairing data. Are you sure? (yes/no): ', async (answer) => {
            rl.close();

            if (answer.toLowerCase() !== 'yes') {
                console.log('\n❌ Cancelled. No data was deleted.\n');
                resolve();
                return;
            }

            const client = new MongoClient(MONGODB_URI);

            try {
                console.log('\n🔌 Connecting to MongoDB...');
                await client.connect();
                console.log('✅ Connected!');

                const db = client.db(DB_NAME);
                const pairingsCollection = db.collection('pairings');

                const countBefore = await pairingsCollection.countDocuments();
                console.log(`\n📊 Found ${countBefore} pairing(s) to delete`);

                if (countBefore === 0) {
                    console.log('   Nothing to delete!\n');
                    resolve();
                    return;
                }

                console.log('🗑️  Deleting...');
                const result = await pairingsCollection.deleteMany({});

                console.log(`\n✅ Deleted ${result.deletedCount} pairing(s)`);
                console.log('💡 You can now re-verify to create fresh data with proper attributes\n');

            } catch (error) {
                console.error('\n❌ Error:', error);
            } finally {
                await client.close();
                console.log('🔌 Disconnected from MongoDB\n');
                resolve();
            }
        });
    });
}

clearDatabase().catch(console.error);
