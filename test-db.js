import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ Error: MONGO_URI is not defined in .env file!");
  process.exit(1);
}

console.log("==========================================");
console.log("  Testing MongoDB Atlas Connection...     ");
console.log("==========================================");
console.log(`Connecting to: ${uri.replace(/:([^:@]+)@/, ':****@')}`);

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
});

async function run() {
  const startTime = Date.now();
  try {
    await client.connect();
    const pingResult = await client.db("admin").command({ ping: 1 });
    const latency = Date.now() - startTime;

    console.log("\n✅ MongoDB Connection Successful!");
    console.log(`⏱️ Latency: ${latency}ms`);
    console.log("📡 Ping Response:", pingResult);

    // List databases
    const adminDb = client.db().admin();
    const dbsList = await adminDb.listDatabases();
    console.log("\n📂 Available Databases:");
    dbsList.databases.forEach(db => {
      console.log(` - ${db.name} (${(db.sizeOnDisk / 1024).toFixed(2)} KB)`);
    });

    console.log("\n🎉 Database connection is verified and operational!");
  } catch (error) {
    console.error("\n❌ MongoDB Connection Failed!");
    console.error("Error Details:", error.message);
    if (error.codeName) console.error("Code Name:", error.codeName);
    if (error.code) console.error("Error Code:", error.code);
  } finally {
    await client.close();
    console.log("==========================================");
  }
}

run();
