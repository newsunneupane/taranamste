import mongoose from "mongoose";
import dns from "dns";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://taranamesteadmin:admin12345@cluster0.gjnkm9h.mongodb.net/taranameste";
const SRV_SHARDS = ["ac-duxgon8-shard-00-00.gjnkm9h.mongodb.net","ac-duxgon8-shard-00-01.gjnkm9h.mongodb.net","ac-duxgon8-shard-00-02.gjnkm9h.mongodb.net"];
try { dns.setServers(["8.8.8.8","1.1.1.1"]);}catch{}
try{ const r=SRV_SHARDS.map(n=>({name:n,port:27017,priority:0,weight:0})); dns.promises.resolveSrv=()=>Promise.resolve(r); dns.resolveSrv=(h,cb)=>cb(null,r);}catch{}
const heads = [
  { name:"Birthday", code:"INC-BIRTHDAY", description:"Birthday donations - janma din ko abasarma" },
  { name:"Memorial", code:"INC-MEMORIAL", description:"Memorial donations - samjhanama / punya tithi" },
  { name:"Management Support", code:"INC-MGMT", description:"Byawasthapan sahayog" },
  { name:"Membership", code:"INC-MEMBERSHIP", description:"Aajiwan sadasyata" },
  { name:"Other", code:"INC-OTHER", description:"Other income - general donations" },
];
const AccountHeadSchema = new mongoose.Schema({ name:String, code:String, type:String, fundCategory:String, description:String, isBankAccount:Boolean, bankDetails:Object, isSystem:Boolean, isActive:Boolean },{timestamps:true});
const AccountHead = mongoose.models.AccountHead || mongoose.model("AccountHead", AccountHeadSchema);
async function run(){
  await mongoose.connect(MONGODB_URI);
  console.log("Connected", mongoose.connection.name);
  let created=0, existed=0, updated=0;
  for(const h of heads){
    let existing = await AccountHead.findOne({ name: h.name });
    if(existing){
      if(existing.code!==h.code || existing.type!=="INCOME"){
        existing.code=h.code; existing.type="INCOME"; existing.fundCategory="UNRESTRICTED"; existing.isActive=true;
        await existing.save(); console.log(`  UPDATED: ${h.name} -> ${h.code}`); updated++;
      } else { console.log(`  EXISTS: ${h.name} (${h.code})`); existed++; }
      continue;
    }
    const codeExists = await AccountHead.findOne({ code: h.code });
    if(codeExists){ console.log(`  CODE COLLISION ${h.code} used by "${codeExists.name}"`); existed++; continue; }
    await AccountHead.create({ name:h.name, code:h.code, type:"INCOME", fundCategory:"UNRESTRICTED", description:h.description, isSystem:false, isActive:true, isBankAccount:false, bankDetails:{accountNumber:"",bankName:"",branch:""}});
    console.log(`  CREATED: ${h.name} (${h.code})`); created++;
  }
  const total = await AccountHead.countDocuments({ type:"INCOME"});
  console.log(`\nDone: created ${created}, existed ${existed}, updated ${updated}, total INCOME heads: ${total}`);
  const all = await AccountHead.find({type:"INCOME"}).sort({name:1}).lean();
  console.log(all.map(a=>` - ${a.name} (${a.code})`).join("\n"));
  await mongoose.disconnect();
}
run().catch(e=>{console.error(e);process.exit(1);});
