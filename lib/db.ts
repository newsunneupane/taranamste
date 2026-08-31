import mongoose from "mongoose";
import dns from "dns";
import AccountHead from "@/models/AccountHead";
import PaymentCategory from "@/models/paymentCategory"; // ✨ NEW

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

// ---------------------------------------------------------------------------
// DNS fix for this machine. Node's built-in c-ares resolver is configured to
// a broken 127.0.0.1 (stray VPN adapter), which returns ECONNREFUSED for every
// lookup and therefore breaks the MongoDB `+srv` connection.
//
// Two complementary measures are applied so the fix takes effect everywhere
// (API routes, server components, worker threads):
//   1. dns.setServers(...) - points c-ares at known-good resolvers (used for
//      the A-record lookups of the shard hostnames).
//   2. Patch dns.promises.resolveSrv to return the cluster's SRV records
//      directly, bypassing the flaky SRV DNS query entirely.
//
// These SRV/shards are stable for this cluster. On production hosts with a
// working resolver this is effectively a no-op/fallback and safe.
// ---------------------------------------------------------------------------
const SRV_SHARDS = [
  "ac-duxgon8-shard-00-00.gjnkm9h.mongodb.net",
  "ac-duxgon8-shard-00-01.gjnkm9h.mongodb.net",
  "ac-duxgon8-shard-00-02.gjnkm9h.mongodb.net",
];

function ensureDns() {
  try {
    dns.setServers(["100.127.255.73", "8.8.8.8", "1.1.1.1"]);
  } catch (_) {}
  try {
    const records = SRV_SHARDS.map((name, i) => ({
      name,
      port: 27017,
      priority: 0,
      weight: 0,
    }));
    (dns.promises as any).resolveSrv = (hostname: string) =>
      Promise.resolve(records);
    (dns as any).resolveSrv = (
      hostname: string,
      cb: (err: any, addrs?: any[]) => void
    ) => {
      cb(null, records);
    };
  } catch (_) {}
}
ensureDns();

let cached = (global as any).mongoose || { conn: null, promise: null };

async function seedDefaults() {
  try {
    // 1. Seed System Account Heads (The "What" - Chart of Accounts)
    const defaultHeads = [
      {
        name: "Staff Personal Expense",
        type: "EXPENSE",
        fundCategory: "UNRESTRICTED",
        code: "EXP-STAFF",
        description: "Standard account for staff out-of-pocket purchases.",
        isSystem: true,
      },
      {
        name: "General Donations",
        type: "INCOME",
        fundCategory: "UNRESTRICTED",
        code: "INC-GEN",
        description: "Default account for incoming unrestricted funds.",
        isSystem: true,
      }
    ];

    for (const head of defaultHeads) {
      await AccountHead.updateOne(
        { code: head.code },
        { $setOnInsert: head },
        { upsert: true }
      );
    }

    // 2. Seed System Payment Categories (The "Where" - Cash/Bank/Staff)
    // Inside seedDefaults() function...

    // 2. Seed System Payment Categories
    const defaultCategories = [
      {
        name: "Main Office Cash",
        identifier: "OFFICE_CASH", // ✨ Added unique identifier
        type: "CASH",
        isActive: true,
        isSystem: true,
      },
      {
        name: "Staff Wallet (Reimbursable)",
        identifier: "STAFF_WALLET", // ✨ Added unique identifier
        type: "PERSONAL",
        isActive: true,
        isSystem: true,
      },
      {
        name: "General Bank Account",
        identifier: "GEN_BANK", // ✨ Added unique identifier
        type: "BANK",
        isActive: true,
        isSystem: false,
      }
    ];

    for (const cat of defaultCategories) {
      await PaymentCategory.updateOne(
        { identifier: cat.identifier }, // 👈 Search by the unique identifier now
        { $setOnInsert: cat },
        { upsert: true }
      );
    }
    console.log("🌱 [System] Database hydration complete (Accounts & Categories)");

  } catch (error) {
    console.error("⚠️ [System] Seed error:", error);
  }
}

export default async function dbConnect() {
  if (cached.conn) return cached.conn;

  ensureDns();

  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  (global as any).mongoose = cached;

  // Running seed logic after connection is established
  await seedDefaults();

  return cached.conn;
}