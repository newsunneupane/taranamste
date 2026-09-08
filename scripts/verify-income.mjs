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
const inHeads = await AccountHead.find({type:"INCOME"}).sort({name:1}).lean();
console.log(`INCOME heads: ${inHeads.length}`);
inHeads.forEach(h=>console.log(`  ${h.name} (${h.code})`));
const totalI = await Transaction.countDocuments({type:"INCOME"});
console.log(`\nTotal INCOME transactions: ${totalI}`);
const sumI = await Transaction.aggregate([{$match:{type:"INCOME"}},{$group:{_id:null, total:{$sum:"$amount"}}}]);
console.log(`Sum INCOME: NPR ${(sumI[0]?.total||0).toLocaleString("en-IN")}`);
const perHead = await Transaction.aggregate([{$match:{type:"INCOME"}},{$group:{_id:"$accountHead", count:{$sum:1}, sum:{$sum:"$amount"}}},{$lookup:{from:"accountheads", localField:"_id", foreignField:"_id", as:"head"}},{$unwind:"$head"},{$project:{name:"$head.name", code:"$head.code", count:1, sum:1}},{$sort:{name:1}}]);
console.log("\nPer head INCOME:");
perHead.forEach(p=>console.log(`  ${p.name} (${p.code}): ${p.count} rows, NPR ${p.sum.toLocaleString("en-IN")}`));
const totalE = await Transaction.countDocuments({type:"EXPENSE"});
const sumE = await Transaction.aggregate([{$match:{type:"EXPENSE"}},{$group:{_id:null, total:{$sum:"$amount"}}}]);
console.log(`\nEXPENSE: ${totalE} rows, NPR ${(sumE[0]?.total||0).toLocaleString("en-IN")}`);
console.log(`Net (INCOME - EXPENSE): NPR ${((sumI[0]?.total||0)-(sumE[0]?.total||0)).toLocaleString("en-IN")}`);
await mongoose.disconnect();
