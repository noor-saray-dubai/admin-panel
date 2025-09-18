const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function clearAuditLogs() {
  console.log('🧹 Clearing Audit Logs to fix data type issues...\n');

  try {
    console.log('1️⃣ Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    console.log('✅ Connected to MongoDB\n');

    console.log('2️⃣ Clearing existing audit logs...');
    const result = await db.collection('auditlogs').deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} existing audit log entries\n`);

    console.log('3️⃣ Closing connection...');
    await client.close();
    console.log('✅ Connection closed\n');

    console.log('🎉 Audit logs cleared successfully!');
    console.log('💡 The system will now use Firebase UIDs (strings) instead of MongoDB ObjectIds');
    console.log('🔥 You can now try logging in again!\n');

  } catch (error) {
    console.error('❌ Error clearing audit logs:', error);
    process.exit(1);
  }
}

// Run the script
clearAuditLogs().then(() => {
  console.log('✨ Script completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});