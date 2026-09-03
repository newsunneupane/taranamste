import dns from "dns";
import mongoose from "mongoose";
import { bsToAdParts } from "@itzsa/bs-date";
try { dns.setServers(["8.8.8.8","1.1.1.1","100.127.255.73"]); } catch(_){}
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://taranamesteadmin:admin12345@cluster0.gjnkm9h.mongodb.net/taranameste";
const TransactionSchema = new mongoose.Schema({}, { strict:false });
const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);

function bsToAdIso(bsStr:string): string{
  const s=bsStr.replace(/\//g,"-").replace(/\./g,"-").trim();
  const [y,m,d]=s.split("-").map(Number);
  const ad=bsToAdParts({year:y, month:m, day:d} as any);
  const pad=(n:number)=>String(n).padStart(2,"0");
  return `${ad.year}-${pad(ad.month)}-${pad(ad.day)}`;
}

async function main(){
  const cutoffBs="2083-03-31";
  const cutoffAdIso=bsToAdIso(cutoffBs);
  const cutoffDate=new Date(cutoffAdIso);
  console.log(`Cutoff BS ${cutoffBs} -> AD ${cutoffAdIso} -> ${cutoffDate.toISOString()}`);

  await mongoose.connect(MONGODB_URI);
  console.log("Connected");

  const total=await Transaction.countDocuments({});
  console.log("Total transactions before:", total);

  const counts = await Transaction.aggregate([
    {$group:{_id:"$type", count:{$sum:1}}},
  ]);
  console.log("By type before:", counts);

  const contraCount=await Transaction.countDocuments({referenceNumber: /^CONTRA-/});
  console.log("Money movements (CONTRA-) count:", contraCount);

  const recentExpenses=await Transaction.find({type:"EXPENSE", date: {$gte: cutoffDate}}).lean();
  console.log(`Expenses >= cutoff (${cutoffAdIso}) count:`, recentExpenses.length);
  recentExpenses.slice(0,5).forEach((t:any)=> console.log(`  ${new Date(t.date).toISOString().slice(0,10)} | ${t.amount} | ${t.description?.slice(0,80)} | ${t.referenceNumber||""} | head:${t.accountHead}`));

  const incomeCount=await Transaction.countDocuments({type:"INCOME"});
  const assetCount=await Transaction.countDocuments({type:"ASSET"});
  const liabilityCount=await Transaction.countDocuments({type:"LIABILITY"});
  console.log(`Income: ${incomeCount}, Asset: ${assetCount}, Liability: ${liabilityCount}`);

  const doDelete=process.argv.includes("--execute");
  if(!doDelete){
    console.log("\nDry-run only. Run with --execute to delete.");
    console.log("Would delete:");
    console.log(` - All INCOME: ${incomeCount}`);
    console.log(` - All ASSET: ${assetCount}`);
    console.log(` - All LIABILITY: ${liabilityCount}`);
    console.log(` - All CONTRA- money movements: ${contraCount} (these may overlap with above counts if they are INCOME/EXPENSE with CONTRA-)`);
    console.log(` - That 1 (or ${recentExpenses.length}) recent EXPENSE >= ${cutoffAdIso}: ${recentExpenses.length}`);
    console.log(` - Note: CONTRA- are pairs of INCOME+EXPENSE with accountHead null; they will be deleted as part of INCOME/EXPENSE counts plus explicit CONTRA- filter for safety`);
    console.log(`Remaining would be: EXPENSE with date < ${cutoffAdIso} (should be ${total - incomeCount - assetCount - liabilityCount - recentExpenses.length} plus dedup for CONTRA double count)`);
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log("\n--- EXECUTING DELETE ---");
  // Delete all non-expense types
  const delIncome=await Transaction.deleteMany({type:"INCOME"});
  console.log(`Deleted INCOME: ${delIncome.deletedCount}`);
  const delAsset=await Transaction.deleteMany({type:"ASSET"});
  console.log(`Deleted ASSET: ${delAsset.deletedCount}`);
  const delLiab=await Transaction.deleteMany({type:"LIABILITY"});
  console.log(`Deleted LIABILITY: ${delLiab.deletedCount}`);
  // Money movements: any with CONTRA- (safety, though already deleted as INCOME/EXPENSE above, but keep for any orphan)
  const delContra=await Transaction.deleteMany({referenceNumber: /^CONTRA-/});
  console.log(`Deleted CONTRA- (remaining): ${delContra.deletedCount}`);
  // Recent expenses beyond cutoff (that 1)
  const delRecent=await Transaction.deleteMany({type:"EXPENSE", date: {$gte: cutoffDate}});
  console.log(`Deleted recent EXPENSE >= ${cutoffAdIso}: ${delRecent.deletedCount}`);

  const afterTotal=await Transaction.countDocuments({});
  const afterByType=await Transaction.aggregate([{$group:{_id:"$type", count:{$sum:1}}}]); 
  console.log("\nAfter total:", afterTotal);
  console.log("After by type:", afterByType);
  console.log("Remaining sample:", await Transaction.find({}).sort({date:-1}).limit(3).lean().then((arr:any[])=> arr.map(t=> `${new Date(t.date).toISOString().slice(0,10)} ${t.type} ${t.amount} ${String(t.description||"").slice(0,50)}`)));

  await mongoose.disconnect();
  process.exit(0);
}
main().catch(e=>{ console.error(e); process.exit(1); });
