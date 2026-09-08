import mongoose from "mongoose";
import dns from "dns";
import { bsToAdParts, isValidBsDate } from "@itzsa/bs-date";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://taranamesteadmin:admin12345@cluster0.gjnkm9h.mongodb.net/taranameste";
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

const pad2 = n => String(n).padStart(2,"0");
function norm(s){ return String(s||"").trim().toLowerCase(); }
function normalizeDate(raw){
  let s = String(raw||"").trim();
  // fix letter O -> 0
  s = s.replace(/O/g,"0").replace(/o/g,"0");
  // normalize separators
  s = s.replace(/[./]/g,"-").replace(/\s+/g,"");
  // collapse multiple dashes
  s = s.replace(/-+/g,"-");
  // fix 009 -> 09
  s = s.replace(/-0+(\d)/g,"-$1");
  // handle like 2082-009-30 already collapsed
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
  const norm = s.replace(/[./]/g,"-").replace(/\s+/g,"");
  const parts = norm.split("-");
  if(parts.length!==3) return { adIso:null, wasBs:false, error:`Date must be YYYY-MM-DD, got "${s}"` };
  const y = Number(parts[0]); const m = Number(parts[1]); const d = Number(parts[2]);
  if(!Number.isFinite(y)||!Number.isFinite(m)||!Number.isFinite(d)) return { adIso:null, wasBs:false, error:`Invalid date "${s}"` };
  if(m<1||m>12||d<1||d>32) return { adIso:null, wasBs:false, error:`Invalid date "${s}"` };
  if(y>=2070 && y<=2100){
    try{
      if(isValidBsDate({year:y,month:m,day:d})){
        const ad = bsToAdParts({year:y,month:m,day:d});
        return { adIso:`${ad.year}-${pad2(ad.month)}-${pad2(ad.day)}`, wasBs:true };
      } else {
        // Try to find last valid day of that BS month
        let last = d;
        while(last>28 && !isValidBsDate({year:y,month:m,day:last})){ last--; }
        if(isValidBsDate({year:y,month:m,day:last})){
          const ad = bsToAdParts({year:y,month:m,day:last});
          return { adIso:`${ad.year}-${pad2(ad.month)}-${pad2(ad.day)}`, wasBs:true, corrected:true, original:s, correctedDate:`${y}-${pad2(m)}-${pad2(last)}` };
        }
        return { adIso:null, wasBs:true, error:`Invalid BS date "${s}"` };
      }
    }catch(e){ return { adIso:null, wasBs:true, error:e.message||`Invalid BS date "${s}"` }; }
  }
  const adIso = `${y}-${pad2(m)}-${pad2(d)}`;
  const dt = new Date(adIso);
  if(isNaN(dt.getTime())) return { adIso:null, wasBs:false, error:`Invalid AD date "${s}"` };
  return { adIso, wasBs:false };
}

// RAW: [date, head, amount, description]
const RAW = [
["2082-12-13","Fee",2400,"College fee payment"],
["2082-12-14","Maintenance",165,"Purchase of vehicle spare parts"],
["2082-12-15","Maintenance",545,"Purchase of raw materials and repair work"],
["2082-12-17","Food Item",920,"Food grains and ration expenses"],
["2082-12-17","Government Fee",2500,"Land ownership copy certificate fee"],
["2082-12-18","Tiffin",1520,"Examination snacks and refreshments"],
["2082-12-19","Shoes",1375,"Purchase of shoes"],
["2082-12-19","Vegetables",1600,"Vegetables purchase"],
["2082-12-24","Food Item",3675,"Grocery provisions purchase"],
["2082-12-26","Water",2990,"Drinking water expenses"],
["2082-12-16","Fee",13880,"Sandesh coaching fee payment"],
["2082-12-16","Internet and Electricity",8320,"Electricity tariff settlement"],
["2082-12-16","Tiffin",4200,"Tulsa snacks and meal expenses"],
["2082-12-16","Transportation",9850,"Tulsa bus travel fare"],
["2082-12-22","Medicine",9500,"Medical treatment expenses"],
["2082-12-20","Medicine",15400,"Health insurance policy premium"],
["2082-12-21","Government Fee",800,"Land ownership transfer official fee"],
["2082-12-21","Vegetables",1200,"Vegetables purchase"],
["2082-12-21","Food Item",580,"Grocery food supplies"],
["2082-12-21","Tiffin",880,"Snacks and refreshments"],
["2082-12-22","Dairy Items",1500,"Fresh milk purchase"],
["2082-12-21","Vegetables",600,"Vegetables purchase"],
["2082-12-28","Dairy Items",9600,"Monthly milk account settlement"],
["2082-12-29","Salary",27700,"Salary given to yasodha"],
["2082-12-29","Salary",23250,"Salary given to durga"],
["2082-12-29","Salary",13850,"salary given to bina"],
["2082-12-29","Fruits",2300,"Fresh fruits purchase"],
["2082-12-21","Cleaning",760,"Cleaning supplies and kitchen maintenance"],
["2082-12-21","Others",1100,"Kitchen items and utensils purchase"],
["2082-12-15","Medicine",2200,"Dinesh medical treatment expenses"],
["2082-10-19","Shoes",965,"Purchase of slippers"],
["2082-10-20","Food Item",1030,"Food provisions purchase"],
["2082-10-21","Cleaning",720,"Cleaning materials"],
["2082-10-21","Food Item",1035,"Food provisions purchase"],
["2082-10-25","Food Item",860,"Food provisions purchase"],
["2082-10-28","Cleaning",530,"Cleaning materials"],
["2082-10-28","Others",530,"Kitchen items purchase"],
["2082-10-29","Maintenance",1165,"Plastic pipe purchase"],
["2082-10-29","Gas",5730,"Cooking gas cylinder purchase"],
["2082-10--30","Salary",23250,"Salary given to durga"],
["2082-10--30","Salary",27700,"salary given to yasodha"],
["2082-10--30","Salary",13850,"salary given to bina"],
["2082-10-30","Dairy Items",11000,"Milk and curd payment"],
["2082-10-30","Vegetables",1900,"Vegetables purchase"],
["2082-04-05","Vegetables",2400,"Vegetable purchase"],
["2082-04-11","Shoes",1110,"purchase of shoes"],
["2082-04-11","Fee",1500,"Purnima's Computer Fee"],
["2082-04-12","Fruits",3300,"Fruits Purchased"],
["2082-04-13","Fee",4100,"Sandesh Tusion Fee"],
["2082-04-20","Vegetables",750,"Vegetable purchase"],
["2082-04-21","Gas",9845,"Cooking Gas Cylinder Purchase"],
["2082-04-25","Food Item",7125,"Food provision purchase"],
["2082-04-28","Tiffin",6510,"Snacks & Refreshments"],
["2082-04-28","Salary",64800,"salary given to durga,yasodha,bina"],
["2082-04-29","Dairy Items",9920,"Milk and curd payment"],
["2082-04-29","Vegetables",7830,"Vegetable purchase"],
["2082-04-19","Others",3800,"Room Rent Paid"],
["2082-04-19","Cleaning",2250,"Cleaning materials"],
["2082-04-10","Cloth",8700,"Cloth purchased for Sujan and puja"],
["2082-04-10","Shoes",1084,"purchase of shoes"],
["2082-05-04","Festival",1200,"Puja Appliances bought"],
["2082-05-05","Food Item",600,"Food Provisions purchase"],
["2082-05-09","Food Item",10350,"Food Provisions purchase"],
["2082-05-18","Festival",5500,"Puja Appliances bought"],
["2082-05-28","Internet and Electricity",14500,"Internet bill paid"],
["2082-05-24","Gas",6410,"Cooking Gas Cylinder Purchased"],
["2082-05-25","Vegetables",1700,"Vegetable Purchase"],
["2082-05-25","Internet and Electricity",400,"Internet Router Bought"],
["2082-05-28","Food Item",2095,"Food Provisions purchase"],
["2082-05-28","Tiffin",8120,"Snacks & Refreshment"],
["2082-05-28","Internet and Electricity",9000,"Electricity tariff settlement"],
["2082-05-29","Fruits",3000,"Fruits purchased"],
["2082-05-30","Salary",64800,"salary given to durga yasodha and bina"],
["2082-05-30","Dairy Items",9920,"Milk payment"],
["2082-05-30","Dairy Items",1400,"Ghee payment"],
["2082-05-30","Vegetables",8300,"Vegetable Purchase"],
["2082-05-30","Tiffin",1560,"Snacks & Refreshment"],
["2082-05-30","Others",3800,"Room Rent Paid"],
["2082-06-02","Food Item",22650,"Food Provisions purchased"],
["2082-06-04","Fruits",3300,"Fruits purchased"],
["2082-06-08","Shoes",5450,"Purchase of Shoes"],
["2082-06-10","Cloth",23950,"Dashain Clothes Shopping"],
["2082-06-11","Shoes",3550,""],
["2082-06-11","Cloth",12608,"Dashain Clothes Shopping"],
["2082-06-13","Cloth",3100,"Dashain Clothes Shopping"],
["2082-06-13","Food Item",3500,"Meat purchased"],
["2082-06-13","Food Item",6255,"Food Provisions purchased"],
["2082-06-13","Others",6765,"Miscellaneous items purchased"],
["2082-06-13","Government Fee",10050,"Government bill paid"],
["2082-06-21","Cloth",1190,"Arjun clothes purchased"],
["2082-06-28","Water",3500,"Drinking water expenses"],
["2082-06-29","Others",3800,"Room Rent Paid"],
["2082-06-29","Vegetables",6800,"Vegetable Purchase"],
["2082-06-31","Salary",129600,"salary given to durga,bina,yasodha"],
["2082-06-31","Dairy Items",11320,"Milk Payment"],
["2082-06-31","Fruits",1150,"Fruits purchased"],
["2082-06-31","Tiffin",9000,"Tiffin Expencess"],
["2083/O2/01","Cloth",200,"SOCKS"],
["2083/O2/01","Cloth",1751,"SCHOOL SHIRT"],
["2083/O2/07","Food Item",1630,"FOOD ITEMS"],
["2083/O2/07","Others",5005,"CURTAINS"],
["2083/O2/07","Fee",6000,"SUMAN"],
["2083/O2/17","Others",1500,"SPEAKER"],
["2083/O2/17","Cloth",980,"SCHOOL DRESS"],
["2083/O2/17","Fee",4000,"SANDESH"],
["2083/O2/19","Stationary",2403,"BOOKS"],
["2083/O2/19","Fruits",2020,"FRUITS"],
["2083/O2/20","Cleaning",1700,""],
["2083/O2/21","Government Fee",1000,"NAGARIKTA SHIFARISH"],
["2083/O2/24","Food Item",400,"FOOD ITEMS"],
["2083/O2/25","Cloth",19440,"SCHOOL DRESS"],
["2083/O2/26","Cloth",18900,"SCHOOL DRESS"],
["2083/O2/29","Internet and Electricity",5050,"ELECTRICITY BILL"],
["2083/O2/29","Water",2990,"WATER BILL"],
["2083/O2/31","Tiffin",510,"PRIYA"],
["2083/O2/31","Dairy Items",1500,"GHEE"],
["2083/O2/31","Fruits",1050,"FRUITS"],
["2083/O2/31","Cloth",1436,"SCHOOL DRESS"],
["2083/O2/31","Vegetables",760,"VEGETABLES"],
["2083/O2/31","Dairy Items",9920,"MILK"],
["2083/02/31","Salary",64800,"Durga,yasodha,bina"],
["2083/O2/09","Gas",3240,"GAS(3)"],
["2083/O2/09","Others",1270,""],
["2083/O2/09","Others",7370,""],
["2083/O2/09","Gas",3240,"GAS(3)"],
["2083/O1/01","Food Item",2400,"OIL"],
["2083/O1/03","Cloth",1948,"HALF PANT"],
["2083/O1/04","Shoes",880,"SLIPPERS"],
["2083/O1/12","Gas",3240,"GAS(3)"],
["2083/O1/15","Tiffin",9700,"DINESH"],
["2083/O1/15","Others",1500,""],
["2083/O1/15","Maintenance",1590,"LOCKS"],
["2083/O1/17","Vegetables",1750,"VEGETABLES"],
["2083/O1/17","Internet and Electricity",1130,"ROUTER"],
["2083/O1/19","Food Item",1625,"FOOD ITEMS"],
["2083/O1/21","Fee",3500,"ANJANA"],
["2083/O1/22","Medicine",11690,"KUSHAL"],
["2083/O1/30","Tiffin",2870,"PRIYA"],
["2083/O1/31","Dairy Items",9920,"MILK"],
["2083/O1/31","Dairy Items",1500,"GHEE"],
["2083/01/31","Salary",64800,"Salaray given to yasodha, durga,bina"],
["2083/O1/31","Fruits",2200,"FRUITS"],
["2082/11/02","Food Item",640,"FOOD ITEMS"],
["2082/11/02","Food Item",880,"FOOD ITEMS"],
["2082/11/02","Cleaning",1200,""],
["2082/11/19","Food Item",1880,"FOOD ITEMS"],
["2082/11/30","Government Fee",4000,"Renewal of org"],
["2082/11/24","Food Item",1400,"FOOD ITEMS"],
["2082/11/25","Food Item",500,"FOOD ITEMS"],
["2082/11/27","Gas",5730,"GAS"],
["2082/11/27","Cleaning",460,"Cleaning Items Bought"],
["2082/11/28","Tiffin",3140,"SANDESH"],
["2082/11/30","Salary",23250,"salary given to durga"],
["2082/11/30","Salary",27700,"slary given to yasodha"],
["2082/11/30","Salary",13850,"salarygiven to chapagain"],
["2082/11/30","Dairy Items",11000,"MILK/GHEE"],
["2082/11/30","Vegetables",4200,"VEGETABLES"],
["2082/09/02","Shoes",2150,"SHOES"],
["2082/09/02","Vegetables",240,"TOMATOES"],
["2082/09/04","Food Item",1250,"FOOD ITEMS"],
["2082/09/04","Food Item",1200,"FOOD ITEMS"],
["2082/09/08","Tiffin",540,"PRIYA"],
["2082/09/13","Vegetables",1400,"VEGETABLES"],
["2082/09/14","Others",1000,"DIPER"],
["2082/09/17","Shoes",960,"SHOES"],
["2082/09/17","Cloth",10000,"COAT PANT"],
["2082/09/17","Shoes",595,"SHOES"],
["2082/09/18","Vegetables",650,"VEGETABLES"],
["2082/09/23","Government Fee",1000,"BANIJYA RAJASWA"],
["2082/09/23","Government Fee",500,"RAJASWA BIRTAMOD"],
["2082/09/23","Internet and Electricity",5000,"ELECTRICITY BILL"],
["2082/09/24","Water",2500,"WATER BILL"],
["2082/09/24","Cloth",3050,""],
["2082/09/25","Vegetables",1500,"VEGETABLES"],
["2082/09/26","Vegetables",930,"VEGETABLES"],
["2082/09/27","Shoes",1720,"SHOES"],
["2082/09/28","Maintenance",20812,"DRINKING WATER TANK"],
["2082/09/30","Dairy Items",18880,"MILK"],
["2082/09/30","Gas",5730,"GAS"],
["2082/009/30","Salary",64800,"salary given"],
["2082/08/01","Maintenance",3000,"INTSALATION DONE"],
["2082/08/01","Maintenance",3025,"PRINTER"],
["2082/08/01","Food Item",440,"CHOCOLATE"],
["2082/08/01","Fruits",1400,"FRUITS"],
["2082/08/01","Cleaning",920,"SOAP AND SURF"],
["2082/08/14","Maintenance",3525,"PRINTER"],
["2082/08/14","Tiffin",2010,"PRIYA"],
["2082/08/14","Fruits",800,"FRUITS"],
["2082/08/14","Food Item",880,"FOOD ITEMS"],
["2082/08/20","Vegetables",1980,"VEGETABLES"],
["2082/08/20","Fruits",700,"FRUITS"],
["2082/08/21","Food Item",1000,"FOOD ITEMS"],
["2082/08/21","Cloth",3875,"SWEATER"],
["2082/08/21","Cloth",950,"SWEATER"],
["2082/08/28","Government Fee",600,"NAWIKARAN DASTUR"],
["2082/08/28","Vegetables",825,"VEGETABLES"],
["2082/08/28","Others",2960,""],
["2082/08/28","Gas",5730,"GAS"],
["2082/08/29","Vegetables",2240,"VEGETABLES"],
["2082/08/29","Salary",23250,"salary given to durga"],
["2082/08/29","Salary",27700,"salary given to yasodha"],
["2082/08/29","Salary",13850,"salary given to bina"],
["2082/07/02","Maintenance",900,"PHOTOCOPY MACHINE REPAIR"],
["2082/07/02","Fruits",2000,"FRUITS"],
["2082/07/02","Vegetables",3320,"VEGETABLES"],
["2082/07/11","Festival",11275,"FESTIVAL"],
["2082/07/11","Festival",42000,"SARASWATI PURNIMA UPAHAR"],
["2082/07/14","Food Item",3710,"FOOD ITEMS"],
["2082/07/16","Cloth",220,"SOCKS"],
["2082/07/16","Cloth",500,""],
["2082/07/16","Cloth",960,"SOCKS"],
["2082/07/21","Government Fee",667,"MALPOTH JAGGA"],
["2082/07/21","Fee",1270,"SUMAN"],
["2082/07/25","Shoes",3870,"SHOES"],
["2082/07/26","Tiffin",2000,"DINESH"],
["2082/07/26","Tiffin",3140,"SANDESH"],
["2082/07/26","Tiffin",1455,"PARITA"],
["2082/07/27","Others",2670,""],
["2082/07/27","Cleaning",390,""],
["2082/07/27","Festival",1980,""],
["2082/07/28","Gas",5730,"GAS"],
["2082/07/29","Maintenance",500,"PRINTER"],
["2082/07/29","Cloth",1550,"SUMAN UNIFORM"],
["2082/07/29","Vegetables",2600,"VEGETABLES"],
["2082/07/29","Vegetables",1250,"VEGETABLES"],
["2082/07/29","Dairy Items",9600,"MILK"],
["2082/07/29","Dairy Items",1400,"GHEE"],
["2082/07/29","Salary",23250,"salary to durga"],
["2082/07/29","Salary",27700,"salary to yasodha"],
["2082/07/29","Salary",13850,"salary to bina"],
["2083/03/03","Others",8500,"cycle purchased"],
["2083/03/05","Dairy Items",1500,"ghee payment"],
["2083/03/08","Medicine",195,"medical fee of dinesh"],
["2083/03/08","Medicine",400,"medical fee of dinesh"],
["2083/03/09","Stationary",1000,"book bought"],
["2083/03/09","Vegetables",1630,"vegetable bought"],
["2083/03/09","Government Fee",800,"janma darta"],
["2083/03/10","Cloth",2500,"school dress"],
["2083/03/12","Maintenance",1000,"cycle mantainance"],
["2083/03/14","Cloth",7420,"girl undergarment"],
["2083/03/14","Vegetables",1230,"vegetable bought"],
["2083/03/17","Cloth",1500,"school dress"],
["2083/03/17","Food Item",1360,"food and supplies"],
["2083/03/20","Vegetables",980,"vegetable bought"],
["2083/03/23","Fee",7000,"addmmision of tulasa"],
["2083/03/24","Fee",6000,"addmmision of suman"],
["2083/03/25","Water",1345,"water supply"],
["2083/03/25","Internet and Electricity",2850,"electricity fee payed"],
["2083/03/25","Stationary",58034,"book bought"],
["2083/03/29","Fruits",2800,"mango bought"],
["2083/03/29","Food Item",12503,"food and supplies"],
["2083/03/30","Dairy Items",10240,"milk purchased"],
["2083/03/30","Salary",64800,"salary given to yasodha durga bina"],
["2083/03/30","Tiffin",0,"khaja of priya"],
["2083/03/30","Food Item",695,"food and supplies"],
];

console.log(`RAW rows: ${RAW.length}`);

const TransactionSchema = new mongoose.Schema({
  amount: Number, date: Date, type: String, accountHead: mongoose.Schema.Types.ObjectId,
  paymentCategory: mongoose.Schema.Types.ObjectId, referenceNumber: String, description: String,
  donorOrVendorName: String, logId: mongoose.Schema.Types.ObjectId, status: String, createdBy: mongoose.Schema.Types.ObjectId, verifiedBy: mongoose.Schema.Types.ObjectId, isSettled: Boolean
},{timestamps:true});
const AccountHeadSchema2 = new mongoose.Schema({ name: String, code: String, type: String },{timestamps:true});
const UserSchema = new mongoose.Schema({ email: String, isSuperAdmin: Boolean, role: String },{timestamps:true});
const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
const AccountHead = mongoose.models.AccountHead || mongoose.model("AccountHead", AccountHeadSchema2);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function run(){
  await mongoose.connect(MONGODB_URI);
  console.log("Connected", mongoose.connection.name);

  // 1. Resolve admin user for createdBy
  let admin = await User.findOne({ isSuperAdmin:true });
  if(!admin) admin = await User.findOne({ role:"ADMIN" });
  if(!admin) admin = await User.findOne({ email:"admin@taranamaste.org" });
  if(!admin) admin = await User.findOne({});
  if(!admin) throw new Error("No user found to use as createdBy - create admin first");
  console.log(`Using creator: ${admin.email} (${admin._id}) isSuperAdmin=${admin.isSuperAdmin}`);

  // 2. Load heads map
  const heads = await AccountHead.find({ type:"EXPENSE" }).lean();
  const headByNorm = new Map(heads.map(h=>[norm(h.name), h]));
  console.log(`Loaded ${heads.length} EXPENSE heads`);

  // 3. Normalize & validate
  let cleaned = [];
  let errors = [];
  let zeroSkipped = 0;
  let correctedCount = 0;
  let seenKeys = new Map(); // dedup within upload
  let duplicateWithin = [];

  for(let i=0;i<RAW.length;i++){
    const [rawDate, head, amount, desc] = RAW[i];
    const normHead = norm(head);
    const headObj = headByNorm.get(normHead);
    if(!headObj){
      errors.push(`Row ${i+1}: Unknown head "${head}"`);
      continue;
    }
    const amt = Number(amount);
    if(!amt || amt<=0){
      console.log(`  SKIP zero/invalid amount row ${i+1}: ${rawDate} ${head} ${amount} -> ${desc||""}`);
      zeroSkipped++;
      continue;
    }
    const normalizedDate = normalizeDate(rawDate);
    const parsed = parseBsOrAdDate(normalizedDate);
    if(!parsed.adIso){
      errors.push(`Row ${i+1}: ${parsed.error} (raw="${rawDate}" norm="${normalizedDate}")`);
      continue;
    }
    if(parsed.corrected) correctedCount++;
    const finalBs = parsed.corrected ? parsed.correctedDate : normalizedDate;
    const adIso = parsed.adIso;
    const finalDesc = desc && String(desc).trim() ? String(desc).trim() : `${head} expense`;

    // dedup key: date|head|amount|desc (vendor/ref empty for this dataset)
    const key = `${adIso}|${normHead}|${amt}|${norm(finalDesc)}`;
    if(seenKeys.has(key)){
      duplicateWithin.push(`Row ${i+1} duplicate of row ${seenKeys.get(key)+1}: ${head} ${adIso} ${amt} "${finalDesc}" (raw ${rawDate})`);
      continue; // skip duplicate within upload - keep first
    }
    seenKeys.set(key, i);

    cleaned.push({
      idx: i,
      rawDate,
      normalizedDate,
      finalBs,
      adIso,
      wasBs: parsed.wasBs,
      corrected: !!parsed.corrected,
      head,
      headId: headObj._id,
      amount: amt,
      desc: finalDesc,
      donor: undefined,
      ref: undefined
    });
  }

  console.log(`\nValidation: cleaned ${cleaned.length}, errors ${errors.length}, zeroSkipped ${zeroSkipped}, corrected ${correctedCount}, duplicatesWithin ${duplicateWithin.length}`);
  if(errors.length){ console.log("ERRORS:"); errors.forEach(e=>console.log("  - "+e)); }
  if(duplicateWithin.length){ console.log("DUPLICATES WITHIN (skipped, keeping first):"); duplicateWithin.forEach(d=>console.log("  - "+d)); }
  if(correctedCount) console.log(`Corrected dates: ${correctedCount} rows auto-corrected to last valid BS day`);

  if(cleaned.length===0) throw new Error("No valid rows after cleaning");

  // 4. DB dedup check (existing transactions)
  const headIds = [...new Set(cleaned.map(c=> String(c.headId)))];
  const adDates = cleaned.map(c=>c.adIso);
  const minDate = new Date(Math.min(...cleaned.map(c=> new Date(c.adIso).getTime())));
  const maxDate = new Date(Math.max(...cleaned.map(c=> new Date(c.adIso).getTime())));
  minDate.setHours(0,0,0,0); maxDate.setHours(23,59,59,999);
  const existing = await Transaction.find({
    type:"EXPENSE",
    accountHead: { $in: headIds.map(id=> new mongoose.Types.ObjectId(id)) },
    date: { $gte: minDate, $lte: maxDate }
  }).lean();
  console.log(`Found ${existing.length} existing EXPENSE transactions in date range ${minDate.toISOString().slice(0,10)} to ${maxDate.toISOString().slice(0,10)}`);
  // Build existing keys for exact dedup
  const existingKeys = new Set();
  const headIdToNameNorm = new Map(heads.map(h=>[String(h._id), norm(h.name)]));
  for(const tx of existing){
    const d = new Date(tx.date).toISOString().slice(0,10);
    const hNorm = headIdToNameNorm.get(String(tx.accountHead)) || "";
    const amt = String(tx.amount);
    const descNorm = norm(tx.description||"");
    existingKeys.add(`${d}|${hNorm}|${amt}|${descNorm}`);
  }
  let dbDups = [];
  let toInsert = [];
  for(const c of cleaned){
    const k = `${c.adIso}|${norm(c.head)}|${c.amount}|${norm(c.desc)}`;
    if(existingKeys.has(k)){
      dbDups.push(`Row ${c.idx+1}: ${c.head} ${c.adIso} ${c.amount} "${c.desc}" already exists - skipping`);
    } else {
      toInsert.push(c);
    }
  }
  console.log(`DB dedup: ${dbDups.length} already in DB (skipped), ${toInsert.length} to insert`);
  if(dbDups.length){ dbDups.slice(0,10).forEach(d=>console.log("  - "+d)); if(dbDups.length>10) console.log(`  ... +${dbDups.length-10} more`); }

  if(toInsert.length===0){
    console.log("Nothing to insert - all rows already exist or duplicates");
    await mongoose.disconnect();
    return;
  }

  // 5. Transactional insert
  const session = await mongoose.startSession();
  try{
    session.startTransaction();
    const docs = toInsert.map(c=>({
      amount: c.amount,
      type: "EXPENSE",
      accountHead: c.headId,
      paymentCategory: null,
      date: new Date(c.adIso),
      description: c.desc,
      donorOrVendorName: undefined,
      referenceNumber: undefined,
      status: "VERIFIED",
      createdBy: admin._id,
      verifiedBy: admin._id,
      isSettled: false
    }));
    const BATCH=500;
    let inserted=0;
    for(let i=0;i<docs.length;i+=BATCH){
      const chunk = docs.slice(i,i+BATCH);
      await Transaction.insertMany(chunk, { ordered:true, session });
      inserted+=chunk.length;
      console.log(`  Inserted batch ${i/BATCH+1}: ${chunk.length} (total ${inserted})`);
    }
    await session.commitTransaction();
    console.log(`\nSUCCESS: Inserted ${inserted} transactions (VERIFIED)`);
  }catch(e){
    await session.abortTransaction();
    console.error("FAILED - rolled back:", e.message);
    if(e.code===11000) console.error(JSON.stringify(e.keyValue));
    throw e;
  }finally{
    session.endSession();
  }

  // 6. Summary per head and per month
  const summary = {};
  for(const c of toInsert){
    summary[c.head] = (summary[c.head]||0)+1;
  }
  console.log("\nInserted per head:");
  Object.entries(summary).sort().forEach(([k,v])=>console.log(`  ${k}: ${v}`));
  const totalAmt = toInsert.reduce((s,c)=>s+c.amount,0);
  console.log(`Total amount inserted: NPR ${totalAmt.toLocaleString("en-IN")}`);
  console.log(`Corrected dates: ${correctedCount}, zeroSkipped: ${zeroSkipped}, duplicatesWithin skipped: ${duplicateWithin.length}, dbDups skipped: ${dbDups.length}`);

  await mongoose.disconnect();
}
run().catch(e=>{ console.error(e); process.exit(1); });
