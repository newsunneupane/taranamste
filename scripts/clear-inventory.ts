import dns from "dns";
import mongoose from "mongoose";
try { dns.setServers(["8.8.8.8","1.1.1.1","100.127.255.73"]); } catch(_){}
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://taranamesteadmin:admin12345@cluster0.gjnkm9h.mongodb.net/taranameste";
async function main(){
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;
  console.log("Connected to", mongoose.connection.name);
  const catsBefore = await db.collection("inventorycategories").countDocuments();
  const itemsBefore = await db.collection("inventoryitems").countDocuments();
  const logsBefore = await db.collection("inventorylogs").countDocuments();
  console.log(`Before: categories=${catsBefore}, items=${itemsBefore}, logs=${logsBefore}`);
  if(itemsBefore>0){
    const res = await db.collection("inventoryitems").deleteMany({});
    console.log(`Deleted inventoryitems: ${res.deletedCount}`);
  }
  if(logsBefore>0){
    const res = await db.collection("inventorylogs").deleteMany({});
    console.log(`Deleted inventorylogs: ${res.deletedCount}`);
  }
  if(catsBefore>0){
    const res = await db.collection("inventorycategories").deleteMany({});
    console.log(`Deleted inventorycategories: ${res.deletedCount}`);
  }
  const catsAfter = await db.collection("inventorycategories").countDocuments();
  const itemsAfter = await db.collection("inventoryitems").countDocuments();
  const logsAfter = await db.collection("inventorylogs").countDocuments();
  console.log(`After: categories=${catsAfter}, items=${itemsAfter}, logs=${logsAfter}`);
  await mongoose.disconnect();
  process.exit(0);
}
main().catch(e=>{console.error(e); process.exit(1)});
