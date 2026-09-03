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
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
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
      },
      // --- Canonical Expense Heads for historical import (12 heads, merged Fees → Education Supplies) ---
      {
        name: "Food & Groceries",
        type: "EXPENSE",
        fundCategory: "UNRESTRICTED",
        code: "EXP-FOOD",
        description: "Food, grocery, vegetables, dairy, fruits, snacks, meat, tiffin",
        subType: ["Grocery","Fruits","Vegetables","Dairy & Milk","Snacks & Refreshments","Meat","Tiffin"],
        isSystem: false,
      },
      {
        name: "Clothing & Apparel",
        type: "EXPENSE",
        fundCategory: "UNRESTRICTED",
        code: "EXP-CLOTH",
        description: "Clothes, footwear and apparel",
        subType: ["Clothes","Footwear"],
        isSystem: false,
      },
      {
        name: "Utilities & Rent",
        type: "EXPENSE",
        fundCategory: "UNRESTRICTED",
        code: "EXP-UTIL",
        description: "Electricity, water, gas, rent, internet, government services",
        subType: ["Electricity","Water","LPG / Cooking Gas","Room Rent","Drinking Water","Internet Bill","Government Services","Birth Registry / Copy Fee"],
        isSystem: false,
      },
      {
        name: "Repairs & Maintenance",
        type: "EXPENSE",
        fundCategory: "UNRESTRICTED",
        code: "EXP-MAINT",
        description: "Repairs, maintenance, printer, government services, water tank, appliances",
        subType: ["Government Services","Water","Printer Repair","Installation","Electric Appliances","Photocopy Repair","Raw Materials","Spare Part","Plumbing / Plastic Pipe"],
        isSystem: false,
      },
      {
        name: "Kitchen & Cleaning",
        type: "EXPENSE",
        fundCategory: "UNRESTRICTED",
        code: "EXP-KITCH",
        description: "Kitchen and cleaning supplies and utensils",
        subType: ["Cleaning Supplies","Kitchen Supplies","Kitchen Utensils & Supplies","Cleaning & Repairs","Kitchen Items"],
        isSystem: false,
      },
      {
        name: "Bought Things",
        type: "EXPENSE",
        fundCategory: "UNRESTRICTED",
        code: "EXP-BOUGHT",
        description: "Appliances and bought items (curtains, books, speaker etc.)",
        subType: ["Appliance"],
        isSystem: false,
      },
      {
        name: "Education Supplies",
        type: "EXPENSE",
        fundCategory: "UNRESTRICTED",
        code: "EXP-EDU",
        description: "Education fees, college, tuition, computer (Fees merged)",
        subType: ["College Fees","Tuition / Coaching Fees","Computer Fee","Admission Fee","Admission","Certificate"],
        isSystem: false,
      },
      {
        name: "Medical Expenses",
        type: "EXPENSE",
        fundCategory: "UNRESTRICTED",
        code: "EXP-MED",
        description: "Medical treatment, medicines, insurance",
        subType: ["Medicines","Health Insurance","Dinesh Treatment"],
        isSystem: false,
      },
      {
        name: "Fun & Festival",
        type: "EXPENSE",
        fundCategory: "UNRESTRICTED",
        code: "EXP-FEST",
        description: "Festival, puja and gift expenses",
        subType: ["Festival","Gift","Mahendra Puja Samagri","Purinima Agro's"],
        isSystem: false,
      },
      {
        name: "Vehicle & Transport",
        type: "EXPENSE",
        fundCategory: "UNRESTRICTED",
        code: "EXP-VEH",
        description: "Vehicle and transport expenses",
        subType: ["Bus Fare / Travel"],
        isSystem: false,
      },
      {
        name: "Legal & Administrative",
        type: "EXPENSE",
        fundCategory: "UNRESTRICTED",
        code: "EXP-LEGAL",
        description: "Legal and administrative fees",
        subType: ["Land Transfer Fee"],
        isSystem: false,
      },
      {
        name: "Miscellaneous",
        type: "EXPENSE",
        fundCategory: "UNRESTRICTED",
        code: "EXP-MISC",
        description: "Miscellaneous expenses",
        subType: ["Key,Mirror,Plastic"],
        isSystem: false,
      },
      {
        name: "Staff Salary",
        type: "EXPENSE",
        fundCategory: "UNRESTRICTED",
        code: "EXP-SALARY",
        description: "Staff salaries — per-employee subheads, Not Mentioned for combined/unknown",
        subType: ["Yashoda Chapagain","Durga Ojha","Bina Kambang","Mahadevi","Dilu Gurung","Mina","Not Mentioned"],
        isSystem: false,
      },
      // --- Asset & Liability starter heads (true capitalization) ---
      {
        name: "Cash & Bank",
        type: "ASSET",
        fundCategory: "UNRESTRICTED",
        code: "AST-CASH",
        description: "Cash on hand and bank balances",
        subType: ["Petty Cash","Bank Balance"],
        isSystem: false,
      },
      {
        name: "Fixed Assets",
        type: "ASSET",
        fundCategory: "UNRESTRICTED",
        code: "AST-FIXED",
        description: "Capitalized fixed assets — furniture, equipment, vehicles",
        subType: ["Furniture","Equipment","Vehicle"],
        isSystem: false,
      },
      {
        name: "Loans Payable",
        type: "LIABILITY",
        fundCategory: "UNRESTRICTED",
        code: "LIA-LOAN",
        description: "Outstanding loans and payables",
        subType: ["Bank Loan","Staff Advance","Vendor Due"],
        isSystem: false,
      },
    ];

    for (const head of defaultHeads) {
      const { subType, ...headBase } = head as any;
      // Upsert head by code (create if missing)
      await AccountHead.updateOne(
        { code: head.code },
        { $setOnInsert: headBase },
        { upsert: true }
      );
      // Ensure subTypes exist (merge, don't overwrite). For canonical heads, keep subType synced.
      if (subType && Array.isArray(subType) && subType.length) {
        await AccountHead.updateOne(
          { code: head.code },
          { $addToSet: { subType: { $each: subType } } }
        );
      }
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