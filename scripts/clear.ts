import dns from "dns";
import mongoose from "mongoose";

try {
  dns.setServers(["100.127.255.73", "8.8.8.8", "1.1.1.1"]);
} catch (_) {}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://taranamesteadmin:admin12345@cluster0.gjnkm9h.mongodb.net/taranameste";

// Usage:
//   npx tsx scripts/clear.ts                 -> wipe all EXCEPT admin user (safe)
//   npx tsx scripts/clear.ts --keep-admin     -> same safe mode
//   npx tsx scripts/clear.ts --wipe-users     -> wipe EVERYTHING including users (you will be locked out until re-seed)

const args = process.argv.slice(2);
const wipeUsers = args.includes("--wipe-users");
const keepAdmin = !wipeUsers; // default safe

async function clear() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to", mongoose.connection.name, "\n");

  const db = mongoose.connection.db;
  if (!db) throw new Error("No DB handle");

  // Collections as they appear in Atlas (lowercase pluralized by Mongoose)
  const collections = [
    "children",
    "transactions",
    "staffs",
    "inventoryitems",
    "inventorylogs",
    "guardians",
    "accountheads",
    "paymentcategories",
    "actionplans",
    "childcurrentstatuses",
    "donors",
    "users",
  ];

  console.log(`Mode: ${keepAdmin ? "KEEP admin@taranamaste.org (safe)" : "WIPE ALL USERS (full wipe)"}\n`);

  for (const name of collections) {
    try {
      const coll = db.collection(name);
      // check if exists
      const exists = await db.listCollections({ name }).hasNext();
      if (!exists) {
        console.log(`⏭ ${name}: not found, skip`);
        continue;
      }
      const before = await coll.countDocuments();
      if (before === 0) {
        console.log(`✓ ${name}: already empty`);
        continue;
      }

      if (name === "users" && keepAdmin) {
        const res = await coll.deleteMany({ email: { $ne: "admin@taranamaste.org" } });
        console.log(`🗑 ${name}: ${before} -> ${await coll.countDocuments()} (deleted ${res.deletedCount}, kept admin)`);
      } else {
        const res = await coll.deleteMany({});
        console.log(`🗑 ${name}: ${before} -> 0 (deleted ${res.deletedCount})`);
      }
    } catch (e: any) {
      console.log(`⚠ ${name}: ${e.message}`);
    }
  }

  // Also drop orphan collections that may not be in list
  console.log("\n✅ Clear complete.");
  console.log(keepAdmin ? "→ Admin login still works: admin@taranamaste.org / taranamaste@123" : "→ All users deleted — run `npm run seed` to recreate admin.");
  await mongoose.disconnect();
  process.exit(0);
}

clear().catch(async (err) => {
  console.error("❌ Clear failed:", err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
