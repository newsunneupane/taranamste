import mongoose from "mongoose";
import dns from "dns";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://taranamesteadmin:admin12345@cluster0.gjnkm9h.mongodb.net/taranameste";
const SRV_SHARDS = ["ac-duxgon8-shard-00-00.gjnkm9h.mongodb.net","ac-duxgon8-shard-00-01.gjnkm9h.mongodb.net","ac-duxgon8-shard-00-02.gjnkm9h.mongodb.net"];
try { dns.setServers(["8.8.8.8","1.1.1.1"]);}catch{}
try{ const r=SRV_SHARDS.map(n=>({name:n,port:27017,priority:0,weight:0})); dns.promises.resolveSrv=()=>Promise.resolve(r); dns.resolveSrv=(h,cb)=>cb(null,r);}catch{}
const TransactionSchema = new mongoose.Schema({ amount:Number, date:Date, type:String, accountHead:mongoose.Schema.Types.ObjectId, description:String, status:String },{timestamps:true});
const AccountHeadSchema = new mongoose.Schema({ name:String, code:String, type:String },{timestamps:true});
const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
const AccountHead = mongoose.models.AccountHead || mongoose.model("AccountHead", AccountHeadSchema);
await mongoose.connect(MONGODB_URI);
console.log("Connected");
const heads = await AccountHead.find({type:"EXPENSE"}).sort({name:1}).lean();
console.log(`EXPENSE heads: ${heads.length}`);
heads.forEach(h=>console.log(`  ${h.name} (${h.code}) _id=${h._id}`));
const total = await Transaction.countDocuments({type:"EXPENSE"});
console.log(`\nTotal EXPENSE transactions: ${total}`);
const verified = await Transaction.countDocuments({type:"EXPENSE", status:"VERIFIED"});
console.log(`VERIFIED: ${verified}, PENDING: ${total-verified}`);
const sumAgg = await Transaction.aggregate([{ $match:{type:"EXPENSE"}},{$group:{_id:null, total:{$sum:"$amount"}}}]);
console.log(`Sum amount: NPR ${(sumAgg[0]?.total||0).toLocaleString("en-IN")}`);

// per head counts
const perHead = await Transaction.aggregate([
  { $match:{type:"EXPENSE"}},
  { $group:{_id:"$accountHead", count:{$sum:1}, sum:{$sum:"$amount"}}},
  { $lookup:{from:"accountheads", localField:"_id", foreignField:"_id", as:"head"}},
  { $unwind:"$head"},
  { $project:{name:"$head.name", code:"$head.code", count:1, sum:1}},
  { $sort:{name:1}}
]);
console.log("\nPer head:");
perHead.forEach(p=>console.log(`  ${p.name} (${p.code}): ${p.count} rows, NPR ${p.sum.toLocaleString("en-IN")}`));

// per month BS-like: group by AD month
const byMonth = await Transaction.aggregate([
  { $match:{type:"EXPENSE"}},
  { $group:{_id:{y:{$year:"$date"}, m:{$month:"$date"}}, count:{$sum:1}, sum:{$sum:"$amount"}}},
  { $sort:{"_id.y":1,"_id.m":1}}
]);
console.log("\nPer AD month (after BS->AD conversion):");
byMonth.forEach(b=>console.log(`  ${b._id.y}-${String(b._id.m).padStart(2,"0")}: ${b.count} NPR ${b.sum.toLocaleString("en-IN")}`));

// show sample recently inserted
const sample = await Transaction.find({type:"EXPENSE"}).populate("accountHead","name code").sort({date:1}).limit(5).lean();
console.log("\nSample earliest 5:");
sample.forEach(s=>console.log(`  ${new Date(s.date).toISOString().slice(0,10)} | ${s.accountHead?.name} | ${s.amount} | ${s.description}`));
const latest = await Transaction.find({type:"EXPENSE"}).populate("accountHead","name code").sort({date:-1}).limit(5).lean();
console.log("\nSample latest 5:");
latest.forEach(s=>console.log(`  ${new Date(s.date).toISOString().slice(0,10)} | ${s.accountHead?.name} | ${s.amount} | ${s.description}`));

// check duplicates still present?
const dupCheck = await Transaction.aggregate([
  { $match:{type:"EXPENSE"}},
  { $group:{_id:{date:{$dateToString:{format:"%Y-%m-%d",date:"$date"}}, head:"$accountHead", amount:"$amount", desc:"$description"}, count:{$sum:1}}},
  { $match:{count:{$gt:1}}}
]);
console.log(`\nDuplicate groups in DB: ${dupCheck.length}`);
if(dupCheck.length) console.log(dupCheck.slice(0,5));

await mongoose.disconnect();
