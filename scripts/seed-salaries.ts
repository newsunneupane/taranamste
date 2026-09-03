import dns from "dns";
import mongoose, { Schema } from "mongoose";
import { bsToAdParts, isValidBsDate } from "@itzsa/bs-date";
try { dns.setServers(["8.8.8.8","1.1.1.1","100.127.255.73"]); } catch(_){}
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://taranamesteadmin:admin12345@cluster0.gjnkm9h.mongodb.net/taranameste";

const AccountHeadSchema = new Schema({ name:String, code:String, type:String, fundCategory:String, subType:[String], description:String, isSystem:Boolean, isActive:Boolean },{timestamps:true});
const TransactionSchema = new Schema({
  amount:Number, date:Date, type:String, accountHead:{type:Schema.Types.ObjectId, ref:"AccountHead"},
  subType:String, paymentCategory:{type:Schema.Types.ObjectId, ref:"PaymentCategory", default:null},
  description:String, donorOrVendorName:String, referenceNumber:String, status:String, isSettled:Boolean,
  createdBy:{type:Schema.Types.ObjectId, ref:"User"}, verifiedBy:{type:Schema.Types.ObjectId, ref:"User"}, logId:{type:Schema.Types.ObjectId, ref:"InventoryLog"}
},{timestamps:true});
const UserSchema = new Schema({ name:String, email:String, passwordHash:String, role:String, isSuperAdmin:Boolean, permissions:Schema.Types.Mixed, phone:String, isActive:Boolean },{timestamps:true});
const StaffSchema = new Schema({
  userId:{type:Schema.Types.ObjectId, ref:"User", unique:true, sparse:true},
  fullName:{type:String, required:true, trim:true}, nepaliName:String, phone:{type:String, required:true}, email:{type:String, required:true, unique:true, lowercase:true},
  address:String, gender:{type:String, enum:["MALE","FEMALE","OTHER"]}, maritalStatus:{type:String, enum:["SINGLE","MARRIED"]}, status:{type:String, enum:["ACTIVE","ON_LEAVE","RESIGNED","TERMINATED"], default:"ACTIVE"},
  citizenshipNo:String, panNumber:String, applyTDS:Boolean, designation:String, department:String, employmentType:{type:String, enum:["FULL_TIME","PART_TIME","CONTRACT"]}, joinDate:Date,
  salary:{ basicSalary:Number, grade:Number, dearnessAllowance:Number, allowances:{houseRent:Number, medical:Number, transport:Number, food:Number, communication:Number, other:Number}, festivalBonusMonths:Number, insurancePremium:Number },
  financialControls:{allowAdvances:Boolean, maxAdvanceLimit:Number}, ssf:{enrolled:Boolean, ssfNumber:String, employeeContribution:Number, employerContribution:Number},
  bank:{bankName:String, branch:String, accountNumber:String, accountName:String}, profileImageUrl:String
},{timestamps:true});

const AccountHead = mongoose.models.AccountHead || mongoose.model("AccountHead", AccountHeadSchema);
const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Staff = mongoose.models.Staff || mongoose.model("Staff", StaffSchema);

function pad2(n:number){ return String(n).padStart(2,"0"); }
function norm(s:string){ return String(s||"").trim().toLowerCase().replace(/\s+/g," "); }

// BS month name -> BS month number (Baishakh=1)
const monthNameToNum: Record<string,number> = {
  "baishakh":1, "baisakh":1, "jestha":2, "jeshtha":2, "ashadh":3, "ashad":3, "shrawan":4, "shravan":4,
  "bhadra":5, "ashwin":6, "ashoj":6, "kartik":7, "mangsir":8, "mangshir":8,
  "poush":9, "magh":10, "falgun":11, "chaitra":12
};

function bsMonthYearToAdIso(year:number, monthName:string, day:number=28): string{
  const m = monthNameToNum[norm(monthName)] || 1;
  // Clamp day to valid BS month length
  let d = day;
  // Try to find last valid day if 28 is always valid, but keep 28 as requested fixed
  if(!isValidBsDate({year, month:m, day:d} as any)){
    // fallback to last valid: try 30,29,28...
    for(let tryD=30; tryD>=25; tryD--){
      if(isValidBsDate({year, month:m, day:tryD} as any)){ d=tryD; break; }
    }
  }
  const ad = bsToAdParts({year, month:m, day:d} as any);
  return `${ad.year}-${pad2(ad.month)}-${pad2(ad.day)}`;
}

async function main(){
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected");

  // Ensure admin
  let admin = await User.findOne({email:"admin@taranamaste.org"}) || await User.findOne({isSuperAdmin:true});
  if(!admin) { console.error("Admin not found"); process.exit(1); }
  console.log(`👤 Admin ${admin.email}`);

  // Ensure 13 heads (including EXP-SALARY) via lib/db.ts logic - upsert Salary head
  const salaryHeadDef = { name:"Staff Salary", code:"EXP-SALARY", type:"EXPENSE", fundCategory:"UNRESTRICTED", description:"Staff salaries — per-employee subheads, Not Mentioned for combined/unknown", subType:["Yashoda Chapagain","Durga Ojha","Bina Kambang","Mahadevi","Dilu Gurung","Mina","Not Mentioned"], isSystem:false };
  await AccountHead.updateOne({code:salaryHeadDef.code}, {$setOnInsert: salaryHeadDef}, {upsert:true});
  await AccountHead.updateOne({code:salaryHeadDef.code}, {$addToSet: {subType: {$each: salaryHeadDef.subType}}});
  const salaryHead = await AccountHead.findOne({code:"EXP-SALARY"}).lean() as any;
  console.log(`💼 Head Staff Salary: ${salaryHead._id} subs: ${salaryHead.subType.join(", ")}`);

  // --- Dummy staff creation (later editable) ---
  const staffNames = ["Yashoda Chapagain","Durga Ojha","Bina Kambang","Mahadevi","Dilu Gurung","Mina"];
  let phoneBase = 9800000010;
  for(const name of staffNames){
    const exists = await Staff.findOne({fullName: name});
    if(exists){ console.log(`👤 Staff exists: ${name}`); continue; }
    const slug = name.toLowerCase().replace(/[^a-z]+/g,".").replace(/^\.|\.$/g,"");
    const email = `${slug}@taranamaste.local`;
    const phone = String(phoneBase++);
    try{
      await Staff.create({
        fullName: name,
        phone,
        email,
        status:"ACTIVE",
        address:"",
        designation: name.includes("Chapagain")||name.includes("Ojha")||name.includes("Kambang") ? "Staff" : "Staff",
        joinDate: new Date(),
        salary:{ basicSalary:0, grade:0, dearnessAllowance:0, allowances:{}, festivalBonusMonths:1, insurancePremium:0 },
      });
      console.log(`👤 Created dummy staff: ${name} (${email} / ${phone})`);
    }catch(e:any){
      if(e.code===11000) console.log(`⚠️ Staff ${name} duplicate email/phone, skipped`);
      else console.error(`❌ Staff create ${name}:`, e.message);
    }
  }

  // --- Build salary transactions ---
  // Proper dated rows (13) + month-only (11) = 24 rows total? Let's enumerate:
  // Proper: 2082-12-29 Mahadevi 26600, 2082-12-25 Durga Ojha 22250, 2082-12-28 Dilu 13650, 2082-04-28 Durga Ojha 22250, 2082-04-28 Yashoda 26600, 2082-04-28 Bina 13650, 2082-10-30 Durga 22250, 2082-10-30 Yashoda 26600, 2082-10-30 Bina 13650, 2082-05-30 Not Mentioned 64800, 2082-06-31 Durga 22250, 2082-06-31 Yashoda 26600, 2082-06-31 Bina 13650
  // Month-only (fixed 28, year 2082 per your instruction Baisakh 2082): 
  // SALARY DURGA YASHODA BINA 64800 JESTHA -> Not Mentioned 64800 2082-Jestha-28
  // SALARY YASHODA DURGA 64800 BAISAKH -> Not Mentioned 64800 2082-Baisakh-28
  // DURGA 23250 FALGUN -> Durga Ojha 23250 2082-Falgun-28
  // YASHODA 27700 FALGUN -> Yashoda 27700 Falgun-28
  // MINA 13850 FALGUN -> Mina 13850
  // SALARY 64800 POUSH -> Not Mentioned 64800 Poush-28
  // DURGA 23250 MANGSHIR -> Durga 23250 Mangsir-28
  // YASHODA 27700 MANGSHIR -> Yashoda 27700
  // MINA 13850 MANGSHIR -> Mina 13850
  // DURGA 23250 KARTIK -> Durga 23250 Kartik-28
  // YASHODA 27700 KARTIK -> Yashoda 27700
  // MINA 13850 KARTIK -> Mina 13850
  // Total month-only 12? Let's recount: Jestha 1 + Baisakh 1 + Falgun 3 + Poush 1 + Mangshir 3 + Kartik 3 = 12
  // So grand total = 13 proper + 12 month-only = 25 rows? Let's verify with list below.

  const rawSalaryRows: any[] = [
    // Proper dated (13)
    {dateRaw:"2082-12-29", head:"Staff Salary", sub:"Mahadevi", amount:26600, desc:"Salary given"},
    {dateRaw:"2082-12-25", head:"Staff Salary", sub:"Durga Ojha", amount:22250, desc:"Salary given"},
    {dateRaw:"2082-12-28", head:"Staff Salary", sub:"Dilu Gurung", amount:13650, desc:"Salary given"},
    {dateRaw:"2082-04-28", head:"Staff Salary", sub:"Durga Ojha", amount:22250, desc:"Salary given"},
    {dateRaw:"2082-04-28", head:"Staff Salary", sub:"Yashoda Chapagain", amount:26600, desc:"Salary given"},
    {dateRaw:"2082-04-28", head:"Staff Salary", sub:"Bina Kambang", amount:13650, desc:"Salary given"},
    {dateRaw:"2082-10-30", head:"Staff Salary", sub:"Durga Ojha", amount:22250, desc:"Salary given"},
    {dateRaw:"2082-10-30", head:"Staff Salary", sub:"Yashoda Chapagain", amount:26600, desc:"Salary given"},
    {dateRaw:"2082-10-30", head:"Staff Salary", sub:"Bina Kambang", amount:13650, desc:"Salary given"},
    {dateRaw:"2082-05-30", head:"Staff Salary", sub:"Not Mentioned", amount:64800, desc:"Salary for 3 staff given"},
    {dateRaw:"2082-06-31", head:"Staff Salary", sub:"Durga Ojha", amount:22250, desc:"Salary given"}, // clamped 06-30
    {dateRaw:"2082-06-31", head:"Staff Salary", sub:"Yashoda Chapagain", amount:26600, desc:"Salary given"},
    {dateRaw:"2082-06-31", head:"Staff Salary", sub:"Bina Kambang", amount:13650, desc:"Salary given"},
    // Month-only fixed 28 (12)
    {dateRaw:"MONTH:2082-Jestha-28", head:"Staff Salary", sub:"Not Mentioned", amount:64800, desc:"Salary Durga Yashoda Bina - Jestha (combined)"},
    {dateRaw:"MONTH:2082-Baisakh-28", head:"Staff Salary", sub:"Not Mentioned", amount:64800, desc:"Salary Yashoda Durga - Baisakh (combined)"},
    {dateRaw:"MONTH:2082-Falgun-28", head:"Staff Salary", sub:"Durga Ojha", amount:23250, desc:"Salary FALGUN"},
    {dateRaw:"MONTH:2082-Falgun-28", head:"Staff Salary", sub:"Yashoda Chapagain", amount:27700, desc:"Salary FALGUN"},
    {dateRaw:"MONTH:2082-Falgun-28", head:"Staff Salary", sub:"Mina", amount:13850, desc:"Salary FALGUN"},
    {dateRaw:"MONTH:2082-Poush-28", head:"Staff Salary", sub:"Not Mentioned", amount:64800, desc:"Salary POUSH (combined)"},
    {dateRaw:"MONTH:2082-Mangshir-28", head:"Staff Salary", sub:"Durga Ojha", amount:23250, desc:"Salary MANGSHIR"},
    {dateRaw:"MONTH:2082-Mangshir-28", head:"Staff Salary", sub:"Yashoda Chapagain", amount:27700, desc:"Salary MANGSHIR"},
    {dateRaw:"MONTH:2082-Mangshir-28", head:"Staff Salary", sub:"Mina", amount:13850, desc:"Salary MANGSHIR"},
    {dateRaw:"MONTH:2082-Kartik-28", head:"Staff Salary", sub:"Durga Ojha", amount:23250, desc:"Salary KARTIK"},
    {dateRaw:"MONTH:2082-Kartik-28", head:"Staff Salary", sub:"Yashoda Chapagain", amount:27700, desc:"Salary KARTIK"},
    {dateRaw:"MONTH:2082-Kartik-28", head:"Staff Salary", sub:"Mina", amount:13850, desc:"Salary KARTIK"},
  ];

  // Convert dates to AD iso and Date
  function toAdIso(dateRaw:string): string{
    if(dateRaw.startsWith("MONTH:")){
      const inner = dateRaw.replace("MONTH:","");
      // format 2082-Jestha-28
      const parts = inner.split("-");
      const y = Number(parts[0]);
      const mName = parts[1];
      const d = Number(parts[2]);
      return bsMonthYearToAdIso(y, mName, d);
    } else {
      // normal BS date like 2082-04-28 or 2082-06-31 (clamped)
      let s = dateRaw.replace(/O/g,"0").replace(/\//g,"-");
      const [y,m,dRaw] = s.split("-").map(Number);
      let d = dRaw;
      // Clamp invalid like 06-31
      if(y>=2070 && y<=2100 && !isValidBsDate({year:y, month:m, day:d} as any)){
        for(let tryD=d; tryD>=28; tryD--){
          if(isValidBsDate({year:y, month:m, day:tryD} as any)){ d=tryD; break; }
        }
      }
      if(y>=2070 && y<=2100){
        const ad = bsToAdParts({year:y, month:m, day:d} as any);
        return `${ad.year}-${pad2(ad.month)}-${pad2(ad.day)}`;
      }
      return `${y}-${pad2(m)}-${pad2(d)}`;
    }
  }

  // Map sub names to canonical (fix Durga Oha, etc.)
  function canonicalSubName(s:string): string{
    const n = norm(s);
    if(n==="durga oha"||n==="durga ojha") return "Durga Ojha";
    if(n.includes("yashoda")) return "Yashoda Chapagain";
    if(n.includes("bina")) return "Bina Kambang";
    if(n==="mahadevi") return "Mahadevi";
    if(n.includes("dilu")) return "Dilu Gurung";
    if(n==="mina") return "Mina";
    if(n==="not mentioned") return "Not Mentioned";
    // fallback
    return s;
  }

  const cleaned = rawSalaryRows.map(r=>{
    const adIso = toAdIso(r.dateRaw);
    const sub = canonicalSubName(r.sub);
    // Ensure sub exists in head
    if(!salaryHead.subType.includes(sub)){
      console.log(`Adding missing sub ${sub} to head`);
    }
    return {...r, adIso, subCanon: sub, date: new Date(adIso)};
  });

  console.log(`📄 Salary rows to import: ${cleaned.length}`);
  cleaned.forEach(c=> console.log(`${c.dateRaw} -> ${c.adIso} | ${c.head} / ${c.subCanon} | ${c.amount} | ${c.desc}`));

  // Ensure all subs exist
  const neededSubs = [...new Set(cleaned.map(c=>c.subCanon))];
  await AccountHead.updateOne({code:"EXP-SALARY"}, {$addToSet: {subType: {$each: neededSubs}}});

  // Idempotency: check existing salary transactions in range
  const headId = salaryHead._id;
  const minDate = new Date(Math.min(...cleaned.map(c=> c.date.getTime())));
  const maxDate = new Date(Math.max(...cleaned.map(c=> c.date.getTime())));
  minDate.setHours(0,0,0,0); maxDate.setHours(23,59,59,999);
  const existing = await Transaction.find({type:"EXPENSE", accountHead: headId, date: {$gte:minDate, $lte:maxDate}}).lean();
  console.log(`📊 Existing salary transactions in range ${minDate.toISOString().slice(0,10)} - ${maxDate.toISOString().slice(0,10)}: ${existing.length}`);
  const existingKeys = new Set(existing.map(tx=> `${new Date(tx.date).toISOString().slice(0,10)}|${norm(tx.subType)}|${tx.amount}|${norm(tx.description)}`));
  const toInsert = cleaned.filter(c=> !existingKeys.has(`${c.adIso}|${norm(c.subCanon)}|${c.amount}|${norm(c.desc)}`));
  console.log(`📥 To insert after dedup: ${toInsert.length} (skipped ${cleaned.length-toInsert.length} dup)`);

  if(toInsert.length===0){
    console.log("✅ Nothing to insert");
    await mongoose.disconnect();
    process.exit(0);
  }

  const docs = toInsert.map(c=> ({
    amount: c.amount,
    type: "EXPENSE",
    accountHead: headId,
    subType: c.subCanon,
    paymentCategory: null,
    date: c.date,
    description: c.desc,
    status: "VERIFIED",
    createdBy: admin._id,
    isSettled: false,
  }));

  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    await Transaction.insertMany(docs, {ordered:true, session} as any);
    await session.commitTransaction();
    console.log(`✅ Inserted ${docs.length} salary transactions (VERIFIED)`);
  }catch(e:any){
    await session.abortTransaction();
    console.error("❌ Insert failed", e.message);
    throw e;
  }finally{
    session.endSession();
  }
  await mongoose.disconnect();
  process.exit(0);
}
main().catch(e=>{console.error(e); process.exit(1)});
