import dns from "dns";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Use a working DNS resolver (Node's c-ares sometimes picks up a broken 127.0.0.1,
// which causes ECONNREFUSED on all lookups). Production hosts won't hit this.
try {
  dns.setServers(["100.127.255.73", "8.8.8.8", "1.1.1.1"]);
} catch (_) {}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://taranamesteadmin:admin12345@cluster0.gjnkm9h.mongodb.net/taranameste";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["ADMIN", "SAMITY", "STAFF", "CAREGIVER", "MEDICAL_STAFF", "TEACHER"], default: "SAMITY" },
  isSuperAdmin: { type: Boolean, default: false },
  permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
  phone: { type: String },
  isActive: { type: Boolean, default: false },
  lastLogin: { type: Date },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function seed() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected.\n");

  const passwordHash = await bcrypt.hash("taranamaste@123", 10);

  const admin = await User.findOneAndUpdate(
    { email: "admin@taranamaste.org" },
    {
      $set: {
        name: "System Admin",
        phone: "9800000000",
        role: "ADMIN",
        isSuperAdmin: true,
        permissions: {},
        isActive: true,
        passwordHash,
      },
    },
    { upsert: true, new: true }
  );

  console.log("👤 Admin user is ready:");
  console.log("   📧 Email:    admin@taranamaste.org");
  console.log("   🔑 Password: taranamaste@123");
  console.log(`   Role: ${admin.role} | Active: ${admin.isActive}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  if (mongoose.connection.readyState) mongoose.disconnect();
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
