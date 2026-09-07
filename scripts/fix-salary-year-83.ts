import dns from "dns";
import mongoose, { Schema } from "mongoose";
import { bsToAdParts } from "@itzsa/bs-date";
try { dns.setServers(["8.8.8.8","1.1.1.1","100.127.255.73"]); } catch(_){}
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://taranamesteadmin:admin12345@cluster0.gjnkm9h.mongodb.net/taranameste";

const TransactionSchema = new Schema({ amount:Number, date:Date, type:String, accountHead:{type:Schema.Types.ObjectId, ref:"AccountHead"}, subType:String, description:String, status:String },{timestamps:true, strict:false});
const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);

function pad2(n:number){ return String(n).padStart(2,"0"); }
function bsToIso(year:number, month:number, day:number){
  const ad:any = bsToAdParts({year, month, day} as any);
  return `${ad.year}-${pad2(ad.month)}-${pad2(ad.day)}`;
}

async function main(){
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected");

  const oldBaisakhIso = bsToIso(2082, 1, 28); // 2025-05-11
  const oldJesthaIso  = bsToIso(2082, 2, 28); // 2025-06-10
  const newBaisakhIso = bsToIso(2083, 1, 28); // 2026-05-11
  const newJesthaIso  = bsToIso(2083, 2, 28); // 2026-06-11

  console.log(`Old Baisakh ${oldBaisakhIso} -> New ${newBaisakhIso}`);
  console.log(`Old Jestha  ${oldJesthaIso} -> New ${newJesthaIso}`);

  const oldBaisakhDate = new Date(oldBaisakhIso);
  const oldJesthaDate = new Date(oldJesthaIso);
  const newBaisakhDate = new Date(newBaisakhIso);
  const newJesthaDate = new Date(newJesthaIso);

  // Find candidates: amount 64800, description contains Jestha/Baisakh combined
  const candidates = await Transaction.find({
    amount: 64800,
    description: { $in: ["Salary Durga Yashoda Bina - Jestha (combined)", "Salary Yashoda Durga - Baisakh (combined)"] }
  }).lean() as any[];

  console.log(`Found ${candidates.length} candidates by description`);

  // Also fallback: find by old dates if description was edited
  const byDate = await Transaction.find({
    date: { $in: [oldBaisakhDate, oldJesthaDate] },
    amount: 64800,
  }).lean() as any[];
  console.log(`Found ${byDate.length} by old dates`);

  const allIds = new Set<string>();
  candidates.forEach(c=> allIds.add(String(c._id)));
  byDate.forEach(c=> allIds.add(String(c._id)));
  console.log(`Total unique to check: ${allIds.size}`);

  for(const id of allIds){
    const tx = await Transaction.findById(id);
    if(!tx) continue;
    const txIso = (tx.date as Date).toISOString().slice(0,10);
    console.log(`- ${tx._id} ${tx.description} ${txIso} amount=${tx.amount}`);
  }

  // Perform updates
  // Jestha
  const resJestha = await Transaction.updateMany(
    { description: "Salary Durga Yashoda Bina - Jestha (combined)", amount: 64800, date: oldJesthaDate },
    { $set: { date: newJesthaDate } }
  );
  console.log(`Jestha update matched=${(resJestha as any).matchedCount ?? (resJestha as any).n} modified=${(resJestha as any).modifiedCount ?? (resJestha as any).nModified}`);

  const resBaisakh = await Transaction.updateMany(
    { description: "Salary Yashoda Durga - Baisakh (combined)", amount: 64800, date: oldBaisakhDate },
    { $set: { date: newBaisakhDate } }
  );
  console.log(`Baisakh update matched=${(resBaisakh as any).matchedCount ?? (resBaisakh as any).n} modified=${(resBaisakh as any).modifiedCount ?? (resBaisakh as any).nModified}`);

  // Broader fallback: if date drift (timezone), match by ISO string range
  // Ensure no leftover old dates remain
  const leftover = await Transaction.find({
    description: { $in: ["Salary Durga Yashoda Bina - Jestha (combined)", "Salary Yashoda Durga - Baisakh (combined)"] },
    date: { $in: [oldBaisakhDate, oldJesthaDate] }
  }).lean();
  if(leftover.length>0){
    console.log(`⚠️ Still leftover with old dates: ${leftover.length}`);
    for(const l of leftover as any[]){
      const isJestha = l.description.includes("Jestha");
      const newDate = isJestha ? newJesthaDate : newBaisakhDate;
      await Transaction.updateOne({_id: l._id}, {$set:{date:newDate}});
      console.log(`Fixed leftover ${l._id}`);
    }
  } else {
    console.log("✅ No leftovers - all fixed");
  }

  const verify = await Transaction.find({
    description: { $in: ["Salary Durga Yashoda Bina - Jestha (combined)", "Salary Yashoda Durga - Baisakh (combined)"] }
  }).lean() as any[];
  verify.forEach(v=> console.log(`VERIFY ${v.description} -> ${(v.date as Date).toISOString().slice(0,10)}`));

  await mongoose.disconnect();
  console.log("Done");
}
main().catch(e=>{console.error(e); process.exit(1)});
