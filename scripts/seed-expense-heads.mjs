import mongoose from "mongoose";
import dns from "dns";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://taranamesteadmin:admin12345@cluster0.gjnkm9h.mongodb.net/taranameste";

// DNS fix same as lib/db.ts
const SRV_SHARDS = [
  "ac-duxgon8-shard-00-00.gjnkm9h.mongodb.net",
  "ac-duxgon8-shard-00-01.gjnkm9h.mongodb.net",
  "ac-duxgon8-shard-00-02.gjnkm9h.mongodb.net",
];
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch {}
try {
  const records = SRV_SHARDS.map(name=>({name,port:27017,priority:0,weight:0}));
  dns.promises.resolveSrv = () => Promise.resolve(records);
  dns.resolveSrv = (h,cb)=>cb(null, records);
} catch {}

const heads = [
  { name: "Fee", code: "EXP-FEE", description: "College, coaching, tuition, admission fees" },
  { name: "Maintenance", code: "EXP-MAINT", description: "Vehicle, pipe, printer, tank, repairs" },
  { name: "Food Item", code: "EXP-FOODITEM", description: "Food grains, rations, provisions, oil, meat" },
  { name: "Government Fee", code: "EXP-GOVFEE", description: "Land, renewal, revenue, administrative govt fees" },
  { name: "Tiffin", code: "EXP-TIFFIN", description: "Snacks and refreshments" },
  { name: "Shoes", code: "EXP-SHOES", description: "Shoes and slippers" },
  { name: "Vegetables", code: "EXP-VEGETABLES", description: "Vegetable purchases" },
  { name: "Water", code: "EXP-WATER", description: "Drinking water expenses" },
  { name: "Medicine", code: "EXP-MEDICINE", description: "Medical treatment and insurance" },
  { name: "Internet and Electricity", code: "EXP-INTERNET", description: "Electricity tariff, internet, router" },
  { name: "Transportation", code: "EXP-TRANSPORT", description: "Bus and travel fares" },
  { name: "Dairy Items", code: "EXP-DAIRY", description: "Milk, curd, ghee" },
  { name: "Salary", code: "EXP-SALARY", description: "Staff salaries - yasodha, durga, bina" },
  { name: "Fruits", code: "EXP-FRUITS", description: "Fruits purchase" },
  { name: "Cleaning", code: "EXP-CLEANING", description: "Cleaning and soap materials" },
  { name: "Others", code: "EXP-OTHERS", description: "Miscellaneous - rent, curtains, speaker, books" },
  { name: "Gas", code: "EXP-GAS", description: "Cooking gas cylinder" },
  { name: "Cloth", code: "EXP-CLOTH", description: "Clothes, school dress, uniform, socks" },
  { name: "Festival", code: "EXP-FESTIVAL", description: "Festival and puja expenses" },
  { name: "Stationary", code: "EXP-STATIONARY", description: "Books and stationary" },
];

const AccountHeadSchema = new mongoose.Schema({
  name: String, code: String, type: String, fundCategory: String, description: String,
  isBankAccount: Boolean, bankDetails: Object, isSystem: Boolean, isActive: Boolean
}, { timestamps: true });
const AccountHead = mongoose.models.AccountHead || mongoose.model("AccountHead", AccountHeadSchema);

async function run(){
  await mongoose.connect(MONGODB_URI);
  console.log("Connected", mongoose.connection.name);
  let created=0, existed=0, updated=0;
  for(const h of heads){
    const existing = await AccountHead.findOne({ name: h.name });
    if(existing){
      // ensure code matches, update if code differs or type wrong
      if(existing.code !== h.code || existing.type !== "EXPENSE"){
        existing.code = h.code;
        existing.type = "EXPENSE";
        existing.fundCategory = "UNRESTRICTED";
        existing.isActive = true;
        await existing.save();
        console.log(`  UPDATED: ${h.name} -> ${h.code}`);
        updated++;
      } else {
        console.log(`  EXISTS: ${h.name} (${h.code})`);
        existed++;
      }
      continue;
    }
    // check code collision with different name
    const codeExists = await AccountHead.findOne({ code: h.code });
    if(codeExists){
      console.log(`  CODE COLLISION: ${h.code} already used by "${codeExists.name}" - skipping ${h.name} (will use existing)`);
      existed++;
      continue;
    }
    await AccountHead.create({
      name: h.name,
      code: h.code,
      type: "EXPENSE",
      fundCategory: "UNRESTRICTED",
      description: h.description,
      isSystem: false,
      isActive: true,
      isBankAccount: false,
      bankDetails: { accountNumber:"", bankName:"", branch:"" }
    });
    console.log(`  CREATED: ${h.name} (${h.code})`);
    created++;
  }
  const total = await AccountHead.countDocuments({ type:"EXPENSE" });
  console.log(`\nDone: created ${created}, existed ${existed}, updated ${updated}, total EXPENSE heads now: ${total}`);
  const all = await AccountHead.find({type:"EXPENSE"}).sort({name:1}).lean();
  console.log(all.map(a=>` - ${a.name} (${a.code})`).join("\n"));
  await mongoose.disconnect();
}
run().catch(e=>{ console.error(e); process.exit(1); });
