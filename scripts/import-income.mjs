import mongoose from "mongoose";
import dns from "dns";
import { bsToAdParts, isValidBsDate } from "@itzsa/bs-date";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://taranamesteadmin:admin12345@cluster0.gjnkm9h.mongodb.net/taranameste";
const SRV_SHARDS = ["ac-duxgon8-shard-00-00.gjnkm9h.mongodb.net","ac-duxgon8-shard-00-01.gjnkm9h.mongodb.net","ac-duxgon8-shard-00-02.gjnkm9h.mongodb.net"];
try { dns.setServers(["8.8.8.8","1.1.1.1"]);}catch{}
try{ const r=SRV_SHARDS.map(n=>({name:n,port:27017,priority:0,weight:0})); dns.promises.resolveSrv=()=>Promise.resolve(r); dns.resolveSrv=(h,cb)=>cb(null,r);}catch{}
const pad2=n=>String(n).padStart(2,"0");
const norm=s=>String(s||"").trim().toLowerCase();
function normalizeDate(raw){
  let s = String(raw||"").trim();
  s = s.replace(/O/g,"0").replace(/o/g,"0");
  s = s.replace(/\s+/g,"");
  // handle M/D/YYYY or D/M/YYYY -> convert to YYYY-MM-DD
  if(s.includes("/")){
    const p = s.split("/");
    if(p.length===3){
      // Determine if first part is month (M/D/YYYY) where p[2] is year 20xx
      // Your data is M/D/YYYY (4/4/2082). So p0=month, p1=day, p2=year
      const m = pad2(Number(p[0]));
      const d = pad2(Number(p[1]));
      const y = String(p[2]).padStart(4,"0");
      s = `${y}-${m}-${d}`;
    }
  }
  s = s.replace(/[./]/g,"-").replace(/-+/g,"-");
  const parts = s.split("-");
  if(parts.length===3){
    const y = parts[0].padStart(4,"0");
    const m = pad2(Number(parts[1]));
    const d = pad2(Number(parts[2]));
    s = `${y}-${m}-${d}`;
  }
  return s;
}
function parseBsOrAdDate(input){
  const s = String(input).trim();
  if(!s) return { adIso:null, wasBs:false, error:"empty" };
  const normS = s.replace(/[./]/g,"-").replace(/\s+/g,"");
  const parts = normS.split("-");
  if(parts.length!==3) return { adIso:null, wasBs:false, error:`Date must be YYYY-MM-DD, got "${s}"` };
  const y=Number(parts[0]), m=Number(parts[1]), d=Number(parts[2]);
  if(!Number.isFinite(y)||!Number.isFinite(m)||!Number.isFinite(d)) return { adIso:null, wasBs:false, error:`Invalid date "${s}"` };
  if(m<1||m>12||d<1||d>32) return { adIso:null, wasBs:false, error:`Invalid date "${s}"` };
  if(y>=2070 && y<=2100){
    try{
      if(isValidBsDate({year:y,month:m,day:d})){
        const ad = bsToAdParts({year:y,month:m,day:d});
        return { adIso:`${ad.year}-${pad2(ad.month)}-${pad2(ad.day)}`, wasBs:true };
      } else {
        let last=d; while(last>28 && !isValidBsDate({year:y,month:m,day:last})) last--;
        if(isValidBsDate({year:y,month:m,day:last})){
          const ad = bsToAdParts({year:y,month:m,day:last});
          return { adIso:`${ad.year}-${pad2(ad.month)}-${pad2(ad.day)}`, wasBs:true, corrected:true, original:s, correctedDate:`${y}-${pad2(m)}-${pad2(last)}` };
        }
        return { adIso:null, wasBs:true, error:`Invalid BS date "${s}" month ${m} has <=${last} days` };
      }
    }catch(e){ return { adIso:null, wasBs:true, error:e.message||`Invalid BS date "${s}"` }; }
  }
  const adIso = `${y}-${pad2(m)}-${pad2(d)}`;
  const dt=new Date(adIso);
  if(isNaN(dt.getTime())) return { adIso:null, wasBs:false, error:`Invalid AD date "${s}"` };
  return { adIso, wasBs:false };
}
// RAW: [dateBS, description, amountStr, category]
const RAW = [
["4/4/2082","Lal Bdr. Giri, Sumnima Udas - Aama ko janma din ko abasarma, Haldibari-3","13,000","Birthday"],
["4/10/2082","Sujata Udas (Gairi) - Janmadin ko abasarma","9,500","Birthday"],
["4/15/2082","Jiya Gurung, Bhadrapur-3 - Janmadin ko abasarma","13,020","Birthday"],
["4/15/2082","Mina Khatiwada, Birtamod-1 - Chhora ko janma dinma","1,000","Birthday"],
["4/20/2082","Kamala Pathak Siwakoti, Birtamod-4 - Sasu sasura ko samjhanama","2,600","Memorial"],
["4/24/2082","Anurag Shrestha, Birtamod-5 - Janmadin ko abasarma","2,000","Birthday"],
["4/31/2082","Bijay Dhimal, Birtamod - Janmadin ko abasarma","3,005","Birthday"],
["4/31/2082","Nitu Bhandari, Birtamod-5 - Janmadin ko abasarma","1,000","Birthday"],
["4/31/2082","Pratima Gautam, Birtamod-4 - Janmadin ko abasarma","4,105","Birthday"],
["5/5/2082","Deshmaya Rai, Birtamod - Byawasthapan sahayog","3,101","Management Support"],
["5/10/2082","Shankar + Bhawana, Birtamod - Byawasthapan sahayog","9,200","Management Support"],
["5/18/2082","Soma B.K., Birtamod - Byawasthapan sahayog","600","Management Support"],
["6/19/2082","Suresh Chauhan, Birtamod-4 - Janmadin ko abasarma","6,500","Birthday"],
["6/25/2082","Nisam Jaiswal, Birtamod-4 - Janmadin ko abasarma","3,000","Birthday"],
["7/1/2082","Sapana Thapa, Suryodaya N.Pa.-4 - Aajiwan sadasyata bapat bank ma jamma","51,000","Membership"],
["7/20/2082","Bishal + Sunita Rai, London - Sworgiya chhori haruko janma din ko samjhanama","17,500","Memorial"],
["7/20/2082","Shyam + Shila Koirala, America hal chhori Usha Koirala ko janma din ko abasarma","5,000","Birthday"],
["7/20/2082","Ram Bahadur Niraula, Birtamod-5 - Sworgiya shrimati ko samjhanama","15,000","Memorial"],
["7/20/2082","Bishal + Smriti Thapa - Chhora Baibhav ko janma dinma prapta","1,400","Birthday"],
["7/20/2082","Indira Dahal, Birtamod - Byawasthapan sahayog","500","Management Support"],
["7/20/2082","Rijan + Binita Kharel, Birtamod-4 - Janma din ko abasarma","5,000","Birthday"],
["8/1/2082","Asha Thapa Chudal, Birtamod-4 - Chhora ko janmadin ko abasarma","5,002","Birthday"],
["8/7/2082","Sita Dhakal, Birtamod-4 - Janma din ko abasarma","5,000","Birthday"],
["8/16/2082","Abinas Tamang, Dang - Janmadin ko abasarma","4,000","Birthday"],
["8/17/2082","Goma Khadka, Birtamod-1 - Janmadin ko abasarma","3,350","Birthday"],
["8/22/2082","Dinesh B.K., Birtamod-6 - Byawasthapan sahayog","500","Management Support"],
["8/29/2082","Sita Khatiwada, Birtamod-4 - 42 au punya tithima","4,000","Memorial"],
["8/29/2082","Riya Poudel, Arjundhara-11 - Janma din ko abasarma","2,400","Birthday"],
["8/23/2082","Jiban Dahal, Birtamod-2 - Janmadin","5,000","Birthday"],
["8/10/2082","Santosh Dhakal, Birtamod-2","5,000","Other"],
["9/4/2082","Devraj Dahal, Bisnu Dahal - Buba ko samjhanama Birtamod-6","1,100","Memorial"],
["9/8/2082","kiran thatal, Birtamod-6 - Janma din ko abasarma","5,640","Birthday"],
["9/17/2082","Bhumika Pokhrel, Birtamod-1 - Ekmusta aajiwan sadasya bapat","51,000","Membership"],
["9/17/2082","Uma Thapa Adhikari, Birtamod-1 - Janmadin ko abasarma","5,005","Birthday"],
["9/19/2082","Kamala Pathak Siwakoti, Birtamod-4 - Janma din ko abasarma","2,000","Birthday"],
["9/19/2082","Manita + Anish Thapa, Bhadrapur-2 - Janma din ko abasarma","3,000","Birthday"],
["9/19/2082","Lions Club of Birtamod City - Hunger relief program","5,000","Other"],
["9/22/2082","Swadesh Khadka - Pita subarna ko janma dinma","5,000","Birthday"],
["9/10/2082","Pratima + Samjhana Katuwal, Birtamod-4 - Aama ko samjhanama","2,000","Memorial"],
["9/24/2082","Gita Chaudhary, Birtamod-4 - Janma din ko abasarma sathai","3,500","Birthday"],
["10/2/2082","Sunil Kharel, Birtamod-4 - Janmadin ko abasarma","5,000","Birthday"],
["10/9/2082","Aayusma Niraula, Birtamod-10 - Janma din ko abasarma","3,000","Birthday"],
["10/9/2082","Arun + Jamuna Timsina, Birtamod-1 - Janma din ko abasarma","6,000","Birthday"],
["10/10/2082","Nitya Agrawal, Birtamod-1","1,700","Other"],
["10/15/2082","Chahata Samuha, Birtamod-5 - Byawasthapan sahayog","20,000","Management Support"],
["10/17/2082","Rajendra Shrestha, Bhadrapur-10","7,055","Other"],
["11/5/2026","Ram + Nisha Karki (Darji), Birtamod-4 - Sw. Daju ko janma dinma","1,500","Memorial"],
["10/4/2082","Min Bdr. Adhikari, Birtamod-4","2,200","Other"],
["10/29/2082","Sneha Kandel, Bhadrapur-8 - Janmadin ko abasarma","7,000","Birthday"],
["11/8/2082","Prasiddha sanuwar, Chandragadi","3,000","Other"],
["11/11/2082","Hemanta Kumar Sendang, Birtamod-1","5,605","Other"],
["11/9/2082","Ganesh + Shobha B.K., Birtamod-6","3,400","Other"],
["11/10/2082","Sujata Basnet, Birtamod-4 - Janma din ko abasarma","1,100","Birthday"],
["11/11/2082","Siyanas Sapkota, Bhadrapur","5,000","Other"],
["11/20/2082","Maya Poudel","41,700","Other"],
["12/2/2082","Punam Poudel, Birtamod-4 - Janma din ko abasarma","1,350","Birthday"],
["12/2/2082","Dipak Rayamajhi, Birtamod-6 - Ek chhak bhojan sahit Janma din ko abasarma","500","Birthday"],
["12/5/2082","Babita Dhimal, Birtamod-3 - Janma din ko abasarma Ek chhak bhojan sahit","2,500","Birthday"],
["12/5/2082","Rita Sapkota, Bhadrapur - Aama ko Punya tithima","5,000","Memorial"],
["12/5/2082","Pratik Shrestha, Birtamod-4 - Byawasthapan sahayog","7,000","Management Support"],
["12/5/2082","Ganesh Timsina, Birtamod-1 - Byawasthapan sahayog","9,000","Management Support"],
["12/14/2082","Samiksha Sewahang, Birtamod-4 - Janma din ko abasarma","10,100","Birthday"],
["12/14/2082","Gaurav Limbu, Bhadrapur-6 - Janma din ko abasarma","5,000","Birthday"],
["12/16/2082","shrijana Khatiwada, Birtamod-1 - Janma din ko abasarma","15,000","Birthday"],
["12/18/2082","Rupa Khadka (Karki), Birtamod-4 - Aajiwan sadasya bapat","56,500","Membership"],
["12/21/2082","Om Prakash Prasai, Birtamod-5 - Janma din ko abasarma","8,500","Birthday"],
["12/21/2082","Ambika Shrestha, Bhadrapur-5 - Byawasthapan sahayog","10,000","Management Support"],
["1/1/2083","Chandra Kala Shrestha, Birtamod-4 - Shriman ko punya tithi ma ek chhak khana ko sath","4,200","Memorial"],
["1/7/2083","Indu Sangraula, Birtamod-6 - Janma din ko abasarma","2,000","Birthday"],
["1/7/2083","Dinesh B.K., Birtamod-5 - Byawasthapan sahayog","900","Management Support"],
["1/8/2083","Hari Bahadur Budhathoki, Garamuni-4 - Punya tithi","6,000","Memorial"],
["1/8/2083","Pratima Rai, Naya Basti - Chhora ko janma dinma","5,000","Birthday"],
["1/10/2083","Uma Dhungana, Bhadrapur-6 - Janma din ko abasarma","3,500","Birthday"],
["1/10/2083","Mahamad Rafik, Rajgadh-1 - Byawasthapan sahayog","500","Management Support"],
["1/10/2083","Bhupal Chauhan, Birtamod-1 - Byawasthapan sahayog","20,000","Management Support"],
["1/10/2083","Bidhya Neupane, Charali","2,505","Other"],
["1/14/2083","Amit Saha, Birtamod-4 - Janma din ko abasarma","2,100","Birthday"],
["1/14/2083","Dinesh Bishwakarma, Birtamod-6 - Byawasthapan sahayog","500","Management Support"],
["1/18/2083","Ram Bdr. Niraula, Birtamod-5 - Aama ko barshik punya tithi ma","2,055","Memorial"],
["1/19/2083","Kukiya Bhattarai Sapkota, US A","2,500","Other"],
["1/30/2083","Elis Khanal, Charpan - Janma din ko abasarma","8,000","Birthday"],
["1/31/2083","Riyanshi Shrestha, Dharampur (Japan) - Janma din ko abasarma","6,400","Birthday"],
["2/1/2083","Gita Neupane, Birtamod-6 - Chhora ko janma din ko abasarma","5,500","Birthday"],
["2/2/2083","Mankumari Acharya, Birtamod-4 - Janma din ko abasarma","3,000","Birthday"],
["2/2/2083","Rita Adhikari, Birtamod-1","3,000","Other"],
["2/7/2083","Shobha Bishwakarma, Birtamod-6 - Buba ko punya tithi ma","50,100","Memorial"],
["2/7/2083","Rupa Mainali Chapagain - Janma din ko abasarma suksuk...","2,000","Birthday"],
["2/15/2083","Tilamaya Gautam, Bahundangi-4 - Aama ko samjhanama","4,100","Memorial"],
["2/15/2083","Bhima Thapa, Bahundangi-4 - Janma din ko abasarma","15,000","Birthday"],
["2/16/2083","Yogesh Karki, Haldibari-4 - Sworgiya chhori ko janma dinma ek chhak bhojan","1,700","Memorial"],
["2/16/2083","Medini Prasad Sangraula, Birtamod-5 - Sworgiya nati ko janma dinma","10,000","Memorial"],
["2/25/2083","Mankumari Acharya, Birtamod-4","1,000","Other"],
["2/25/2083","Rojina Limbu, Arjundhara-11 - Janma din ko abasarma","10,000","Birthday"],
["3/3/2083","Bibek Siwakoti, Birtamod - QR SBT","5,000","Other"],
["3/8/2083","Atish+Chanda Siwakoti, Birtamod-4 - Chhora ko janma din ko abasarma - QR SBT","5,720","Birthday"],
["3/9/2083","Goma Bhattarai, Birtamod-1 - Aajiwan sadasya bapat 2082/2/2 ma muktinath... - Check marfat","5,100","Membership"],
["3/1/2083","Dhan Bahadur Dhimal, Me.Na.Pa.-9 - Janma din ko abasarma","2,000","Birthday"],
["3/23/2083","Kir... J.Y. Yalam, Suryodaya Na.Pa.-2 Ilam - Janma din ko abasarma","8,200","Birthday"],
["3/25/2083","Asis Giri, Birtamod - Byawasthapan sahayog Aama ko samjhanama - Muktinath QR","25,000","Memorial"],
["3/26/2083","Kritika Siwakoti, Birtamod-1 - Janma din ko abasarma - QR Muktinath","3,455","Birthday"],
["3/26/2083","Sunil+Januka Chaulagain, Bahundangi-6 - Aama ko punya tithima","8,600","Memorial"],
["3/27/2083","krishna pd. bhattarai, janma din ko uplalaxyama","7000","Birthday"],
];
console.log(`RAW income rows: ${RAW.length}`);

const TransactionSchema = new mongoose.Schema({ amount:Number, date:Date, type:String, accountHead:mongoose.Schema.Types.ObjectId, paymentCategory:mongoose.Schema.Types.ObjectId, referenceNumber:String, description:String, donorOrVendorName:String, status:String, createdBy:mongoose.Schema.Types.ObjectId, verifiedBy:mongoose.Schema.Types.ObjectId, isSettled:Boolean },{timestamps:true});
const AccountHeadSchema2 = new mongoose.Schema({ name:String, code:String, type:String },{timestamps:true});
const UserSchema = new mongoose.Schema({ email:String, isSuperAdmin:Boolean, role:String },{timestamps:true});
const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
const AccountHead = mongoose.models.AccountHead || mongoose.model("AccountHead", AccountHeadSchema2);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function run(){
  await mongoose.connect(MONGODB_URI);
  console.log("Connected", mongoose.connection.name);
  let admin = await User.findOne({ isSuperAdmin:true });
  if(!admin) admin = await User.findOne({ role:"ADMIN" });
  if(!admin) admin = await User.findOne({});
  if(!admin) throw new Error("No user found");
  console.log(`Using creator: ${admin.email} (${admin._id})`);
  const heads = await AccountHead.find({ type:"INCOME"}).lean();
  const headByNorm = new Map(heads.map(h=>[norm(h.name), h]));
  console.log(`Loaded ${heads.length} INCOME heads`);
  let cleaned=[], errors=[], correctedCount=0, seenKeys=new Map(), duplicateWithin=[];
  for(let i=0;i<RAW.length;i++){
    const [rawDate, desc, amountStr, category] = RAW[i];
    const normHead = norm(category);
    const headObj = headByNorm.get(normHead);
    if(!headObj){ errors.push(`Row ${i+1}: Unknown category "${category}"`); continue; }
    const amt = Number(String(amountStr).replace(/,/g,"").trim());
    if(!amt || amt<=0){ errors.push(`Row ${i+1}: Invalid amount "${amountStr}"`); continue; }
    const normalizedDate = normalizeDate(rawDate);
    const parsed = parseBsOrAdDate(normalizedDate);
    if(!parsed.adIso){ errors.push(`Row ${i+1}: ${parsed.error} (raw="${rawDate}" norm="${normalizedDate}")`); continue; }
    if(parsed.corrected) correctedCount++;
    const adIso = parsed.adIso;
    const finalDesc = String(desc||"").trim() || category;
    const key = `${adIso}|${normHead}|${amt}|${norm(finalDesc)}`;
    if(seenKeys.has(key)){ duplicateWithin.push(`Row ${i+1} duplicate of row ${seenKeys.get(key)+1}: ${category} ${adIso} ${amt}`); continue; }
    seenKeys.set(key,i);
    cleaned.push({ idx:i, rawDate, normalizedDate, adIso, wasBs:parsed.wasBs, corrected:!!parsed.corrected, category, headId:headObj._id, amount:amt, desc:finalDesc });
  }
  console.log(`Validation: cleaned ${cleaned.length}, errors ${errors.length}, corrected ${correctedCount}, duplicatesWithin ${duplicateWithin.length}`);
  if(errors.length){ console.log("ERRORS:"); errors.forEach(e=>console.log("  - "+e)); }
  if(duplicateWithin.length){ console.log("DUPLICATES WITHIN:"); duplicateWithin.forEach(d=>console.log("  - "+d)); }
  if(correctedCount) console.log(`Corrected dates: ${correctedCount} rows auto-corrected`);
  if(cleaned.length===0) throw new Error("No valid rows");
  // DB dedup
  const headIds = [...new Set(cleaned.map(c=> String(c.headId)))];
  const minDate = new Date(Math.min(...cleaned.map(c=> new Date(c.adIso).getTime())));
  const maxDate = new Date(Math.max(...cleaned.map(c=> new Date(c.adIso).getTime())));
  minDate.setHours(0,0,0,0); maxDate.setHours(23,59,59,999);
  const existing = await Transaction.find({ type:"INCOME", accountHead:{$in: headIds.map(id=> new mongoose.Types.ObjectId(id))}, date:{$gte:minDate,$lte:maxDate}}).lean();
  console.log(`Found ${existing.length} existing INCOME in range ${minDate.toISOString().slice(0,10)} to ${maxDate.toISOString().slice(0,10)}`);
  const headIdToNorm = new Map(heads.map(h=>[String(h._id), norm(h.name)]));
  const existingKeys = new Set();
  for(const tx of existing){
    const d = new Date(tx.date).toISOString().slice(0,10);
    const hNorm = headIdToNorm.get(String(tx.accountHead))||"";
    existingKeys.add(`${d}|${hNorm}|${String(tx.amount)}|${norm(tx.description||"")}`);
  }
  let dbDups=[], toInsert=[];
  for(const c of cleaned){
    const k = `${c.adIso}|${norm(c.category)}|${c.amount}|${norm(c.desc)}`;
    if(existingKeys.has(k)) dbDups.push(`Row ${c.idx+1}: ${c.category} ${c.adIso} ${c.amount} already exists`);
    else toInsert.push(c);
  }
  console.log(`DB dedup: ${dbDups.length} already in DB, ${toInsert.length} to insert`);
  if(dbDups.length){ dbDups.slice(0,10).forEach(d=>console.log("  - "+d)); }
  if(toInsert.length===0){ console.log("Nothing to insert"); await mongoose.disconnect(); return; }
  const session = await mongoose.startSession();
  try{
    session.startTransaction();
    const docs = toInsert.map(c=>({ amount:c.amount, type:"INCOME", accountHead:c.headId, paymentCategory:null, date:new Date(c.adIso), description:c.desc, donorOrVendorName:c.desc, referenceNumber:undefined, status:"VERIFIED", createdBy:admin._id, verifiedBy:admin._id, isSettled:false }));
    const BATCH=500; let inserted=0;
    for(let i=0;i<docs.length;i+=BATCH){ const chunk=docs.slice(i,i+BATCH); await Transaction.insertMany(chunk,{ordered:true, session}); inserted+=chunk.length; console.log(`  Inserted batch ${i/BATCH+1}: ${chunk.length} (total ${inserted})`); }
    await session.commitTransaction();
    console.log(`\nSUCCESS: Inserted ${inserted} income transactions (VERIFIED)`);
  }catch(e){ await session.abortTransaction(); console.error("FAILED - rolled back:", e.message); throw e; }finally{ session.endSession(); }
  const summary={}; toInsert.forEach(c=> summary[c.category]=(summary[c.category]||0)+1);
  console.log("\nInserted per category:"); Object.entries(summary).sort().forEach(([k,v])=>console.log(`  ${k}: ${v}`));
  const totalAmt = toInsert.reduce((s,c)=>s+c.amount,0);
  console.log(`Total income inserted: NPR ${totalAmt.toLocaleString("en-IN")}`);
  console.log(`Corrected: ${correctedCount}, duplicatesWithin: ${duplicateWithin.length}, dbDups: ${dbDups.length}`);
  await mongoose.disconnect();
}
run().catch(e=>{console.error(e);process.exit(1);});
