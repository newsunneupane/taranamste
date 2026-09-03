import dns from "dns";
import mongoose, { Schema } from "mongoose";
import { bsToAdParts, isValidBsDate } from "@itzsa/bs-date";

try { dns.setServers(["8.8.8.8","1.1.1.1","100.127.255.73"]); } catch(_){}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://taranamesteadmin:admin12345@cluster0.gjnkm9h.mongodb.net/taranameste";

// ---- Schemas (minimal) ----
const AccountHeadSchema = new Schema({
  name: String, code: String, type: String, fundCategory: String,
  subType: [String], description: String, isSystem: Boolean, isActive: Boolean
},{timestamps:true});
const TransactionSchema = new Schema({
  amount: Number, date: Date, type: String, accountHead: {type: Schema.Types.ObjectId, ref:'AccountHead'},
  subType: String, paymentCategory: {type: Schema.Types.ObjectId, ref:'PaymentCategory', default:null},
  description: String, donorOrVendorName: String, referenceNumber: String,
  status: String, isSettled: Boolean, createdBy: {type: Schema.Types.ObjectId, ref:'User'},
  verifiedBy: {type: Schema.Types.ObjectId, ref:'User'}, logId: {type: Schema.Types.ObjectId, ref:'InventoryLog'}
},{timestamps:true});
const UserSchema = new Schema({
  name: String, email: String, passwordHash: String, role: String, isSuperAdmin: Boolean,
  permissions: Schema.Types.Mixed, phone: String, isActive: Boolean, lastLogin: Date
},{timestamps:true});

const AccountHead = mongoose.models.AccountHead || mongoose.model("AccountHead", AccountHeadSchema);
const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

function norm(s:string){ return String(s||"").trim().toLowerCase().replace(/\s+/g," "); }
function pad2(n:number){ return String(n).padStart(2,"0"); }

// Canonical heads to seed (12)
const canonicalHeads: any[] = [
  { name:"Food & Groceries", code:"EXP-FOOD", type:"EXPENSE", fundCategory:"UNRESTRICTED", description:"Food, grocery, vegetables, dairy, fruits, snacks, meat, tiffin", subType:["Grocery","Fruits","Vegetables","Dairy & Milk","Snacks & Refreshments","Meat","Tiffin"], isSystem:false },
  { name:"Clothing & Apparel", code:"EXP-CLOTH", type:"EXPENSE", fundCategory:"UNRESTRICTED", description:"Clothes, footwear and apparel", subType:["Clothes","Footwear"], isSystem:false },
  { name:"Utilities & Rent", code:"EXP-UTIL", type:"EXPENSE", fundCategory:"UNRESTRICTED", description:"Electricity, water, gas, rent, internet, government services", subType:["Electricity","Water","LPG / Cooking Gas","Room Rent","Drinking Water","Internet Bill","Government Services","Birth Registry / Copy Fee"], isSystem:false },
  { name:"Repairs & Maintenance", code:"EXP-MAINT", type:"EXPENSE", fundCategory:"UNRESTRICTED", description:"Repairs, maintenance, printer, government services, water tank, appliances", subType:["Government Services","Water","Printer Repair","Installation","Electric Appliances","Photocopy Repair","Raw Materials","Spare Part","Plumbing / Plastic Pipe"], isSystem:false },
  { name:"Kitchen & Cleaning", code:"EXP-KITCH", type:"EXPENSE", fundCategory:"UNRESTRICTED", description:"Kitchen and cleaning supplies and utensils", subType:["Cleaning Supplies","Kitchen Supplies","Kitchen Utensils & Supplies","Cleaning & Repairs","Kitchen Items"], isSystem:false },
  { name:"Bought Things", code:"EXP-BOUGHT", type:"EXPENSE", fundCategory:"UNRESTRICTED", description:"Appliances and bought items (curtains, books, speaker etc.)", subType:["Appliance"], isSystem:false },
  { name:"Education Supplies", code:"EXP-EDU", type:"EXPENSE", fundCategory:"UNRESTRICTED", description:"Education fees, college, tuition, computer (Fees merged)", subType:["College Fees","Tuition / Coaching Fees","Computer Fee","Admission Fee","Admission","Certificate"], isSystem:false },
  { name:"Medical Expenses", code:"EXP-MED", type:"EXPENSE", fundCategory:"UNRESTRICTED", description:"Medical treatment, medicines, insurance", subType:["Medicines","Health Insurance","Dinesh Treatment"], isSystem:false },
  { name:"Fun & Festival", code:"EXP-FEST", type:"EXPENSE", fundCategory:"UNRESTRICTED", description:"Festival, puja and gift expenses", subType:["Festival","Gift","Mahendra Puja Samagri","Purinima Agro's"], isSystem:false },
  { name:"Vehicle & Transport", code:"EXP-VEH", type:"EXPENSE", fundCategory:"UNRESTRICTED", description:"Vehicle and transport expenses", subType:["Bus Fare / Travel"], isSystem:false },
  { name:"Legal & Administrative", code:"EXP-LEGAL", type:"EXPENSE", fundCategory:"UNRESTRICTED", description:"Legal and administrative fees", subType:["Land Transfer Fee"], isSystem:false },
  { name:"Miscellaneous", code:"EXP-MISC", type:"EXPENSE", fundCategory:"UNRESTRICTED", description:"Miscellaneous expenses", subType:["Key,Mirror,Plastic"], isSystem:false },
];

// Raw historical data as pasted (tab-separated, 205 rows)
const rawTsv = `
2082-12-13	Education Supplies	College Fees	2400			College fee payment
2082-12-14	Repairs & Maintenance	Spare Part	165			Purchase of vehicle spare parts
2082-12-15	Repairs & Maintenance	 Raw materials 	545			Purchase of raw materials and repair work
2082-12-17	Food & Groceries	Grocery 	910			Food grains and ration expenses
2082-12-17	Utilities & Rent	birtth Registry / Copy Fee	2500			Land ownership copy certificate fee
2082-12-18	Food & Groceries	Snacks & Refreshments	1520			Examination snacks and refreshments
2082-12-19	Clothing & Apparel	Footwear	1375			Purchase of shoes
2082-12-19	Food & Groceries	Vegetables	1600			Vegetables purchase
2082-12-24	Food & Groceries	Grocery 	3655			Grocery provisions purchase
2082-12-26	Utilities & Rent	Drinking Water	3990			Drinking water expenses
2082-12-16	Education Supplies	Tuition / Coaching Fees	13800			Sandesh coaching fee payment
2082-12-16	Utilities & Rent	Electricity	8220			Electricity tariff settlement
2082-12-16	Food & Groceries	Snacks & Refreshments	4200			Tulsa snacks and meal expenses
2082-12-16	Vehicle & Transport	Bus Fare / Travel	9850			Tulsa bus travel fare
2082-12-22	Medical Expenses	Medicines 	3500			Medical treatment expenses
2082-12-20	Medical Expenses	Health Insurance	15400			Health insurance policy premium
2082-12-21	Legal & Administrative	Land Transfer Fee	800			Land ownership transfer official fee
2082-12-21	Food & Groceries	Vegetables	1200			Vegetables purchase
2082-12-21	Food & Groceries	Grocery 	210			Grocery food supplies
2082-12-21	Food & Groceries	Snacks & Refreshments	880			Snacks and refreshments
2082-12-22	Food & Groceries	Dairy & Milk	1500			Fresh milk purchase
2082-12-21	Food & Groceries	Vegetables	600			Vegetables purchase
2082-12-28	Food & Groceries	Dairy & Milk	9600			Monthly milk account settlement
2082-12-29	Food & Groceries	Fruits	2300			Fresh fruits purchase
2082-12-21	Kitchen & Cleaning	Cleaning & Repairs	650			Cleaning supplies and kitchen maintenance
2082-12-21	Kitchen & Cleaning	Kitchen Utensils & Supplies	7710			Kitchen items and utensils purchase
2082-12-15	Medical Expenses	Dinesh Treatment	2200			Dinesh medical treatment expenses
2082-10-19	Clothing & Apparel	Footwear	165			Purchase of slippers
2082-10-20	Food & Groceries	Grocery	1030			Food provisions purchase
2082-10-21	Kitchen & Cleaning	Cleaning Supplies	620			Cleaning materials
2082-10-21	Food & Groceries	Grocery 	1035			Food provisions purchase
2082-10-25	Food & Groceries	Grocery 	860			Food provisions purchase
2082-10-28	Kitchen & Cleaning	Cleaning Supplies	520			Cleaning materials
2082-10-28	Kitchen & Cleaning	Kitchen Supplies	530			Kitchen items purchase
2082-10-29	Repairs & Maintenance	Plumbing / Plastic Pipe	1165			Plastic pipe purchase
2082-10-29	Utilities & Rent	LPG / Cooking Gas	5630			Cooking gas cylinder purchase
2082-10-30	Food & Groceries	Dairy & Milk	11000			Milk and curd payment
2082-10-30	Food & Groceries	Vegetables	1900			Vegetables purchase
2082-04-05	Food & Groceries 	Vegetable 	2400			Vegetable purchase
2082-04-11	Clothing & Apparel	Footwear 	1110			purchase of shoes
2082-04-11	Education Supplies 	 Computer Fee 	1500			Purnima's Computer Fee
2082-04-12	Food and Groceries 	Fruits 	3300			Fruits Purchased
2082-04-13	Education Supplies 	Tution Fee	4100			Sandesh Tusion Fee
2082-04-20	Food & Groceries 	Vegetable 	750			Vegetable purchase
2082-04-21	Utilities & Rent	LPG / Cooking Gas 	9845			Cooking Gas Cylinder Purchase
2082-04-25	Food & Groceries 	Grocery 	3655			Food provision purchase
2082-04-28	Food & Groceries 	Snacks & Refreshments 	6510			Snacks & Refreshments
2082-04-29	Food & Groceries 	Dairy & Milk 	9920			Milk and curd payment
2082-04-29	Food & Groceries 	Vegetables	7820			Vegetable purchase
2082-04-19	Utilities & Rent	Room Rent 	3800			Room Rent Paid
2082-04-19	Kitchen & Cleaning 	Cleaning Supplies 	2250			Cleaning materials
2082-04-10	Clothing & Apparel	Purchase of cloth by Suan and puja 	8700			Cloth purchased for Sujan and puja
2082-04-10	Clothing & Apparel	Footwear 	960			purchase of shoes
2082-05-04	Fun & Festival 	Mahendra puja samjgri 	1200			Puja Appliances bought
2082-05-05	Food & Groceries	Grocery 	600			Food Provisions purchase
2082-05-09	Food & Groceries	Grocery 	8560			Food Provisions purchase
2082-05-18	Fun & Festival 	Purinima agro's 	5500			Puja Appliances bought
2082-05-28	Utilities & Rent 	Internet Bill	14500			Internet bill paid
2082-05-24	Utilities & Rent 	LPG / Cooking Gas 	6410			Cooking Gas Cylinder Purchased
2082-05-25	Food & Groceries	Vegetables 	1700			Vegetable Purchase
2082-05-25	Utilities & Rent 	Router Bought 	400			Internet Router Bought
2082-05-28	Food & Groceries	Grocery 	2095			Food Provisions purchase
2082-05-28	Food & Groceries	Snacks & Refreshment  	8100			Snacks & Refreshment
2082-05-28	Utilities & Rent 	Electricity 	9000			Electricity tariff settlement
2082-05-29	Food & Groceries	Fruits 	3000			Fruits purchased
2082-05-30	Food & Groceries	Dairy & Milk 	9920			Milk payment
2082-05-30	Food & Groceries	Dairy & Milk 	1400			Ghee payment
2082-05-30	Food & Groceries	Vegetables 	8300			Vegetable Purchase
2082-05-30	Food & Groceries	Snacks & Refreshment  	1560			Snacks & Refreshment
2082-05-30	Utilities & Rent 	Room Rent	3800			Room Rent Paid
2082-06-02	Food & Grocery 	Grocery 	22650			Food Provisions purchased
2082-06-04	Food & Grocery 	Fruits 	3300			Fruits purchased
2082-06-08	Clothing & Apparel	Footware	5450			Purchase of Shoes
2082-06-10	Clothing & Apparel	Clothes 	23950			Dashain Clothes Shopping
2082-06-11	Clothing & Apparel	Clothes 	3100			Dashain Clothes Shopping
2082-06-11	Food & Grocery 	Meat 	3500			Meat purchased
2082-06-13	Food & Grocery 	Grocery 	6255			Food Provisions purchased
2082-06-13	Miscellaneous	Key,Mirror,Plastic	6765			Miscellaneous items purchased
2082-06-13	Utilities & Rent 	Goverment expenses 	10050			Government bill paid
2082-06-21	Clothing & Apparel	Clothes 	1190			Arjun clothes purchased
2082-06-28	Utilities & Rent 	Drinking Water 	3500			Drinking water expenses
2082-06-29	Utilities & Rent 	Room Rent 	3800			Room Rent Paid
2082-06-29	Food & Grocery 	Vegetables 	6800			Vegetable Purchase
2082-06-31	Food & Grocery 	Diary & Milk 	11320			Milk Payment
2082-06-31	Food & Grocery 	Fruits 	1150			Fruits purchased
2082-06-31	Food & Grocery 	Tiffin 	9000			Tiffin Expencess
2083/O2/01	CLOTH & APPAREL	CLOTH	200			SOCKS
2083/O2/01	CLOTH & APPAREL	CLOTH	1751			SCHOOL SHIRT
2083/O2/07	FOOD & GROCERY	GROCERY 	1630			FOOD ITEMS
2083/O2/07	BOUGHT THINGS	APPLIANCE	5005			CURTAINS
2083/O2/07	FEES	ADMISSION	6000			SUMAN
2083/O2/17	BOUGHT THINGS	APPLIANCE	1500			SPEAKER
2083/O2/17	CLOTH & APPAREL	CLOTH	980			SCHOOL DRESS
2083/O2/17	FEES	ADMISSION	4000			SANDESH
2083/O2/19	BOUGHT THINGS	APPLIANCE	2403			BOOKS
2083/O2/19	FOOD & GROCERY	FRUITS	2020			FRUITS
2083/O2/20	KITCHEN & CLEANING	CLEANING APPLIANCES 	1700			
2083/O2/21	UTILITIES & RENT	GOVERNMENT SERVICES	1000			NAGARIKTA SHIFARISH
2083/O2/24	FOOD & GROCERY	GROCERY 	400			FOOD ITEMS
2083/O2/25	CLOTH & APPAREL	CLOTH	19440			SCHOOL DRESS
2083/O2/26	CLOTH & APPAREL	CLOTH	18900			SCHOOL DRESS
2083/O2/29	UTILITIES & RENT	ELECTRICITY	5050			ELECTRICITY BILL
2083/O2/29	UTILITIES & RENT	WATER	2990			WATER BILL
2083/O2/31	FOOD & GROCERY	SNACKS & REFRESHMENT	510			PRIYA
2083/O2/31	FOOD & GROCERY	DAIRY & MILK	1500			GHEE
2083/O2/31	FOOD & GROCERY	FRUITS	1050			FRUITS
2083/O2/31	CLOTH & APPAREL	CLOTH	1436			SCHOOL DRESS
2083/O2/31	FOOD & GROCERY	VEGETABLES	760			VEGETABLES
2083/O2/31	FOOD & GROCERY	DAIRY & MILK	9920			MILK
2083/O2/09	UTILITIES & RENT	LPG/COOKING GAS	3240			GAS(3)
2083/O2/09	BOUGHT THINGS	APPLIANCE	1270			
2083/O2/09	BOUGHT THINGS	APPLIANCE	7370			
2083/O2/09	UTILITIES & RENT	LPG/COOKING GAS	3240			GAS(3)
2083/O1/01	FOOD & GROCERY	GROCERY 	2400			OIL
2083/O1/03	CLOTH & APPAREL	CLOTH	1948			HALF PANT
2083/O1/04	CLOTH & APPAREL	FOOTWARE	880			SLIPPERS
2083/O1/12	UTILITIES & RENT	LPG/COOKING GAS	3240			GAS(3)
2083/O1/15	FOOD & GROCERY	SNACKS & REFRESHMENT	9700			DINESH
2083/O1/15	BOUGHT THINGS	APPLIANCE	1500			
2083/O1/15	BOUGHT THINGS	APPLIANCE	1590			LOCKS
2083/O1/17	FOOD & GROCERY	VEGETABLES	1750			VEGETABLES
2083/O1/17	MAINTANANCE & SERVICES	ELECTRIC APPLIANCES	1130			ROUTER
2083/O1/19	FOOD & GROCERY	GROCERY 	1075			FOOD ITEMS
2083/O1/21	Education Supplies 	ADMISSION Fee	3500			ANJANA
2083/O1/22	MEDICAL EXPENSES	Medicines	11690			KUSHAL
2083/O1/30	FOOD & GROCERY	SNACKS & REFRESHMENT	2870			PRIYA
2083/O1/31	FOOD & GROCERY	DAIRY & MILK	9920			MILK
2083/O1/31	FOOD & GROCERY	DAIRY & MILK	1500			GHEE
2083/O1/31	FOOD & GROCERY	FRUITS	2200			FRUITS
2082/11/02	FOOD & GROCERY	GROCERY 	640			FOOD ITEMS
2082/11/02	FOOD & GROCERY	GROCERY 	880			FOOD ITEMS
2082/11/02	KITCHEN & CLEANING	CLEANING APPLIANCES 	1200			
2082/11/19	FOOD & GROCERY	GROCERY 	1880			FOOD ITEMS
2082/11/20	UTILITIES & RENT	Government Services 	4000			Renewal of org
2082/11/24	FOOD & GROCERY	GROCERY 	1400			FOOD ITEMS
2082/11/25	FOOD & GROCERY	GROCERY 	500			FOOD ITEMS
2082/11/27	UTILITIES & RENT	LPG/COOKING GAS	5730			GAS
2082/11/27	KITCHEN & CLEANING	CLEANING APPLIANCES 	460			Cleaning Items Bought
2082/11/28	FOOD & GROCERY	SNACKS & REFRESHMENT	3140			SANDESH
2082/11/30	FOOD & GROCERY	DAIRY & MILK	11000			MILK/GHEE
2082/11/30	FOOD & GROCERY	VEGETABLES	4200			VEGETABLES
2082/09/02	CLOTH & APPAREL	FOOTWARE	2150			SHOES
2082/09/02	FOOD & GROCERY	VEGETABLES	240			TOMATOES
2082/09/04	FOOD & GROCERY	GROCERY 	1250			FOOD ITEMS
2082/09/04	FOOD & GROCERY	GROCERY 	1200			FOOD ITEMS
2082/09/08	FOOD & GROCERY	SNACKS & REFRESHMENT	540			PRIYA
2082/09/13	FOOD & GROCERY	VEGETABLES	1400			VEGETABLES
2082/09/14	BOUGHT THINGS	APPLIANCE	1000			DIPER
2082/09/17	CLOTH & APPAREL	FOOTWARE	960			SHOES
2082/09/17	CLOTH & APPAREL	CLOTH	10000			COAT PANT
2082/09/17	CLOTH & APPAREL	FOOTWARE	595			SHOES
2082/09/18	FOOD & GROCERY	VEGETABLES	650			VEGETABLES
2082/09/23	UTILITIES & RENT	GOVERNMENT SERVICES	1000			BANIJYA RAJASWA
2082/09/23	UTILITIES & RENT	GOVERNMENT SERVICES	500			RAJASWA BIRTAMOD
2082/09/23	UTILITIES & RENT	ELECTRICITY	5000			ELECTRICITY BILL
2082/09/24	UTILITIES & RENT	WATER	2500			WATER BILL
2082/09/24	CLOTH & APPAREL	CLOTH	3050			
2082/09/25	FOOD & GROCERY	VEGETABLES	1500			VEGETABLES
2082/09/26	FOOD & GROCERY	VEGETABLES	930			VEGETABLES
2082/09/27	CLOTH & APPAREL	CLOTH	1720			SHOES
2082/09/28	MAINTANANCE & SERVICES	WATER	20812			DRINKING WATER TANK
2082/09/30	FOOD & GROCERY	DAIRY & MILK	18880			MILK
2082/09/30	UTILITIES & RENT	LPG/COOKING GAS	5730			GAS
2082/08/01	MAINTANANCE & SERVICES	INSTALATION	3000			INTSALATION DONE
2082/08/01	MAINTANANCE & SERVICES	PRINTER REPAIR	3025			PRINTER
2082/08/01	FOOD & GROCERY	SNACKS & REFRESHMENT	441			CHOCOLATE
2082/08/01	FOOD & GROCERY	FRUITS	1400			FRUITS
2082/08/01	KITCHEN & CLEANING	CLEANING APPLIANCES 	920			SOAP AND SURF
2082/08/14	MAINTANANCE & SERVICES	PRINTER REPAIR	3525			PRINTER
2082/08/14	FOOD & GROCERY	SNACKS & REFRESHMENT	2010			PRIYA
2082/08/14	FOOD & GROCERY	FRUITS	800			FRUITS
2082/08/14	FOOD & GROCERY	GROCERY 	880			FOOD ITEMS
2082/08/20	FOOD & GROCERY	VEGETABLES	1980			VEGETABLES
2082/08/20	FOOD & GROCERY	FRUITS	700			FRUITS
2082/08/21	FOOD & GROCERY	GROCERY 	1000			FOOD ITEMS
2082/08/21	CLOTH & APPAREL	CLOTH	3875			SWEATER
2082/08/21	CLOTH & APPAREL	CLOTH	950			SWEATER
2082/08/28	MAINTANANCE & SERVICES	GOVERNMENT SERVICES	600			NAWIKARAN DASTUR
2082/08/28	FOOD & GROCERY	VEGETABLES	825			VEGETABLES
2082/08/28	BOUGHT THINGS	APPLIANCE	2960			
2082/08/28	UTILITIES & RENT	LPG/COOKING GAS	5730			GAS
2082/08/29	FOOD & GROCERY	VEGETABLES	2240			VEGETABLES
2082/07/02	MAINTANANCE & SERVICES	PHOTOCOPY REPAIR	900			PHOTOCOPY MACHINE REPAIR
2082/07/02	FOOD & GROCERY	FRUITS	2000			FRUITS
2082/07/02	FOOD & GROCERY	VEGETABLES	3320			VEGETABLES
2082/07/11	FUN & FESTIVAL	FESTIVAL	11275			FESTIVAL
2082/07/11	FUN & FESTIVAL	Gift 	42000			SARASWATI PURNIMA UPAHAR
2082/07/14	FOOD & GROCERY	GROCERY 	3710			FOOD ITEMS
2082/07/16	CLOTH & APPAREL	CLOTH	220			SOCKS
2082/07/16	CLOTH & APPAREL	CLOTH	500			
2082/07/16	CLOTH & APPAREL	CLOTH	960			SOCKS
2082/07/21	MAINTANANCE & SERVICES	GOVERNMENT SERVICES	667			MALPOTH JAGGA
2082/07/21	FEES	CERTIFICATE	1270			SUMAN
2082/07/25	CLOTH & APPAREL	FOOTWARE	3870			SHOES
2082/07/26	FOOD & GROCERY	SNACKS & REFRESHMENT	2000			DINESH
2082/07/26	FOOD & GROCERY	SNACKS & REFRESHMENT	3140			SANDESH
2082/07/26	FOOD & GROCERY	SNACKS & REFRESHMENT	1455			PARITA
2082/07/27	KITCHEN & CLEANING	KITCHEN ITEMS	4440			
2082/07/28	UTILITIES & RENT	LPG/COOKING GAS	5730			GAS
2082/07/29	MAINTANANCE & SERVICES	PRINTER REPAIR	500			PRINTER
2082/07/29	CLOTH & APPAREL	CLOTH	1550			 SUMAN UNIFORM
2082/07/29	FOOD & GROCERY	VEGETABLES	2600			VEGETABLES
2082/07/29	FOOD & GROCERY	VEGETABLES	1250			VEGETABLES
2082/07/29	FOOD & GROCERY	DAIRY & MILK	9600			MILK
2082/07/29	FOOD & GROCERY	DAIRY & MILK	1400			GHEE
`;

// Helpers
function cleanDateBsToAd(input:string): string {
  let s = input.trim().replace(/O/g,"0").replace(/o/g,"0").replace(/\//g,"-").replace(/\./g,"-");
  s = s.replace(/\s+/g,"");
  const parts = s.split("-");
  if(parts.length!==3) return s;
  const y = Number(parts[0]), m=Number(parts[1]), d=Number(parts[2]);
  if(y>=2070 && y<=2100){
    try{
      if(isValidBsDate({year:y, month:m, day:d} as any)){
        const ad = bsToAdParts({year:y, month:m, day:d} as any);
        return `${ad.year}-${pad2(ad.month)}-${pad2(ad.day)}`;
      }
    }catch{}
  }
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

const headNormToCanonical: Record<string,string> = {
  "food & groceries": "Food & Groceries",
  "food & grocery": "Food & Groceries",
  "food and groceries": "Food & Groceries",
  "clothing & apparel": "Clothing & Apparel",
  "cloth & apparel": "Clothing & Apparel",
  "utilities & rent": "Utilities & Rent",
  "repairs & maintenance": "Repairs & Maintenance",
  "maintanance & services": "Repairs & Maintenance",
  "kitchen & cleaning": "Kitchen & Cleaning",
  "bought things": "Bought Things",
  "education supplies": "Education Supplies",
  "fees": "Education Supplies",
  "medical expenses": "Medical Expenses",
  "fun & festival": "Fun & Festival",
  "vehicle & transport": "Vehicle & Transport",
  "legal & administrative": "Legal & Administrative",
  "miscellaneous": "Miscellaneous",
};

const subFix: Record<string,string> = {
  "vegetable": "Vegetables",
  "snacks & refreshment": "Snacks & Refreshments",
  "footware": "Footwear",
  "cloth": "Clothes",
  "diary & milk": "Dairy & Milk",
  "goverment expenses": "Government Services",
  "birtth registry / copy fee": "Birth Registry / Copy Fee",
  "instalation": "Installation",
  "tution fee": "Tuition / Coaching Fees",
  "admission fee": "Admission Fee",
  "cleaning appliances": "Cleaning Supplies",
  "lpg/cooking gas": "LPG / Cooking Gas",
  "goverment services": "Government Services",
  // keep as is for others: normalize case to canonical below via subType array
};

function canonicalSub(headCanon:string, rawSub:string): string {
  const ns = norm(rawSub);
  if(!ns) return "";
  // Special case: the "Purchase of cloth by Suan and puja" should be Clothes
  if(ns.includes("purchase of cloth by suan")) return "Clothes";
  if(subFix[ns]) return subFix[ns];
  // For heads, try to find exact case-insensitive match in canonicalHeads subType
  const headDef = canonicalHeads.find(h=>h.name===headCanon);
  if(headDef){
    const found = headDef.subType.find((s:string)=> norm(s)===ns);
    if(found) return found;
    // also try subFix keys via norm
    const foundFix = headDef.subType.find((s:string)=> norm(s)===norm(subFix[ns]||""));
    if(foundFix) return foundFix;
  }
  // Capitalize words fallback
  return rawSub.trim().replace(/\s+/g," ").split(" ").map(w=> w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(" ").replace(/\b\w/g,c=>c.toUpperCase());
}

async function main(){
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected");

  // Ensure admin user
  let admin = await User.findOne({email:"admin@taranamaste.org"});
  if(!admin){
    admin = await User.findOne({email: {$regex:/admin/i}});
  }
  if(!admin){
    console.error("❌ Admin user not found. Run seed first (npx tsx scripts/seed.ts)");
    process.exit(1);
  }
  console.log(`👤 Admin: ${admin.email} (${admin._id})`);

  // 1. Upsert 12 heads + ensure subs
  console.log("\n🌱 Seeding 12 canonical heads...");
  for(const h of canonicalHeads){
    const {subType, ...base} = h;
    await AccountHead.updateOne({code:h.code}, {$setOnInsert: base}, {upsert:true});
    if(subType && subType.length){
      await AccountHead.updateOne({code:h.code}, {$addToSet: {subType: {$each: subType}}});
    }
    // also ensure name/type consistency if head existed with different name (historical raw) — don't rename existing different heads, keep canonical separately
  }
  const heads = await AccountHead.find({code: {$in: canonicalHeads.map(h=>h.code)}}).lean();
  const headByCanon = new Map<string, any>();
  heads.forEach((h:any)=> headByCanon.set(h.name, h));
  // also map via norm canonical
  const headByNormCanon = new Map<string, any>();
  heads.forEach((h:any)=> headByNormCanon.set(norm(h.name), h));
  console.log(`✅ Heads ready: ${heads.map((h:any)=> h.name+"("+h.code+")").join(", ")}`);

  // Idempotency: count existing historical transactions (amount>0, type EXPENSE, accountHead in canonical)
  const headIds = heads.map((h:any)=> h._id);
  const existingCount = await Transaction.countDocuments({ type:"EXPENSE", accountHead: {$in: headIds} });
  console.log(`📊 Existing EXPENSE transactions with canonical heads: ${existingCount}`);
  // Check if historical already imported by sampling first row key
  // Build rows first to check dedup
  const rawLines = rawTsv.trim().split("\n").map(l=>l.trim()).filter(l=> /^208/.test(l));
  console.log(`📄 Raw historical lines: ${rawLines.length}`);

  // Parse and clean rows
  const cleaned: any[] = [];
  const skipped: string[] = [];
  for(const line of rawLines){
    const parts = line.split(/\t+/);
    // parts: 0=date,1=head,2=sub,3=amount, 4-6 maybe vendor/ref/desc but our tsv has empty cols; take last non-empty as desc
    const dateRaw = (parts[0]||"").trim();
    const headRaw = (parts[1]||"").trim();
    const subRaw = (parts[2]||"").trim();
    const amountRaw = (parts[3]||"").trim();
    // description is last part after tabs that is non-empty and not amount - in our rawTsv we placed desc as 5th tab value
    // Simpler: take parts[5] or last part
    let descRaw = "";
    // Try to get description: parts[5] if exists else parts[parts.length-1]
    if(parts.length>=6){
      // join from 5 onwards
      descRaw = parts.slice(5).filter(p=>p.trim()).join(" ").trim();
      // fallback to parts[4] etc if empty
      if(!descRaw && parts[4]) descRaw = parts[4].trim();
    }
    if(!descRaw) descRaw = (parts[4]||"").trim();

    if(!dateRaw || !headRaw || !amountRaw){
      skipped.push(line);
      continue;
    }
    const amountNum = Number(amountRaw.replace(/,/g,"").trim());
    if(isNaN(amountNum) || amountNum<=0){
      skipped.push(line);
      continue;
    }
    const nh = norm(headRaw);
    const canonHead = headNormToCanonical[nh] || headRaw.trim();
    const headDoc = headByCanon.get(canonHead) || headByNormCanon.get(norm(canonHead));
    if(!headDoc){
      console.warn(`⚠️ Unknown head after canonical: ${headRaw} -> ${canonHead}`);
      continue;
    }
    // Special: for the cloth purchased row, keep desc
    let subClean = canonicalSub(canonHead, subRaw);
    // Validate sub exists in head subType (case-insensitive)
    const validSubs = new Set((headDoc.subType||[]).map((s:string)=> norm(s)));
    // If subClean not in validSubs but subRaw maps via fix, try again
    if(subClean && !validSubs.has(norm(subClean))){
      // try to find via original norm
      const tryFix = subFix[norm(subRaw)];
      if(tryFix && validSubs.has(norm(tryFix))){
        subClean = tryFix;
      } else {
        // If still invalid, log and use first available? Instead keep as is and add to head (auto-add)
        console.warn(`⚠️ Sub "${subRaw}" -> "${subClean}" not in head "${canonHead}" subs ${headDoc.subType}. Will auto-add.`);
        // Auto-add to head
        await AccountHead.updateOne({_id: headDoc._id}, {$addToSet: {subType: subClean}});
        headDoc.subType.push(subClean);
        validSubs.add(norm(subClean));
      }
    }
    const dateIso = cleanDateBsToAd(dateRaw);
    const dateObj = new Date(dateIso);
    if(isNaN(dateObj.getTime())){
      console.warn(`⚠️ Invalid date ${dateRaw} -> ${dateIso}`);
      continue;
    }
    // Description fallback
    let desc = descRaw;
    if(headRaw.includes("Purchase of cloth by Suan")){
      desc = "Cloth purchased for Sujan and puja";
      subClean = "Clothes";
    }
    if(!desc) desc = `${canonHead}${subClean? " / "+subClean:""} expense`;

    cleaned.push({
      amount: amountNum,
      date: dateObj,
      dateIso,
      headRaw, canonHead, headId: headDoc._id,
      subRaw, subClean,
      amountRaw,
      description: desc,
      donorOrVendorName: undefined,
      referenceNumber: undefined,
    });
  }

  console.log(`✅ Cleaned rows: ${cleaned.length}, skipped: ${skipped.length}`);
  // Aggregate head-> subs in cleaned
  const agg = new Map<string, Set<string>>();
  cleaned.forEach(c=>{
    if(!agg.has(c.canonHead)) agg.set(c.canonHead, new Set());
    if(c.subClean) agg.get(c.canonHead)!.add(c.subClean);
  });
  for(const [h, set] of agg){
    console.log(`  ${h}: ${[...set].join(", ")}`);
  }

  // Idempotency: if we already have >= 200 historical transactions (within date range of cleaned), skip
  const minDate = new Date(Math.min(...cleaned.map(c=> c.date.getTime())));
  const maxDate = new Date(Math.max(...cleaned.map(c=> c.date.getTime())));
  minDate.setHours(0,0,0,0); maxDate.setHours(23,59,59,999);
  const existingInRange = await Transaction.countDocuments({
    type:"EXPENSE",
    accountHead: {$in: headIds},
    date: {$gte: minDate, $lte: maxDate}
  });
  console.log(`📊 Existing canonical transactions in historical range ${minDate.toISOString().slice(0,10)} - ${maxDate.toISOString().slice(0,10)} : ${existingInRange}`);
  if(existingInRange >= 190){
    console.log("⏭️ Historical data appears already imported (>=190 in range). Skipping insert. To re-import, delete those transactions first.");
    await mongoose.disconnect();
    process.exit(0);
  }

  // Deduplicate within cleaned (same key as bulkTransactions)
  const keyFor = (r:any)=>{
    const d = r.dateIso;
    const h = norm(r.canonHead);
    const s = norm(r.subClean||"");
    const amt = String(r.amount);
    const desc = norm(r.description||"");
    // vendor/ref not in historical, ignore
    return `${d}|${h}|${s}|${amt}|${desc}`;
  };
  const seen = new Map<string, number[]>();
  const deduped: any[] = [];
  const dupGroups: any[] = [];
  cleaned.forEach((r,i)=>{
    const k = keyFor(r);
    if(!seen.has(k)){
      seen.set(k, [i]);
      deduped.push(r);
    } else {
      seen.get(k)!.push(i);
      // keep first, mark dup
    }
  });
  const dupCount = cleaned.length - deduped.length;
  if(dupCount>0){
    console.log(`⚠️ Found ${dupCount} duplicate rows within file — will deduplicate to ${deduped.length}`);
  }

  // Check against DB for existing duplicates (same key)
  const existingTx = await Transaction.find({
    type:"EXPENSE",
    accountHead: {$in: headIds},
    date: {$gte: minDate, $lte: maxDate}
  }).lean();
  const existingKeys = new Set<string>();
  // Need head name lookup for key
  const headIdToName = new Map<string,string>();
  heads.forEach((h:any)=> headIdToName.set(String(h._id), h.name));
  for(const tx of existingTx){
    const d = new Date(tx.date).toISOString().slice(0,10);
    const hName = headIdToName.get(String(tx.accountHead)) || "";
    const h = norm(hName);
    const s = norm(tx.subType||"");
    const amt = String(tx.amount);
    const desc = norm(tx.description||"");
    existingKeys.add(`${d}|${h}|${s}|${amt}|${desc}`);
  }
  const toInsert = deduped.filter(r=> !existingKeys.has(keyFor(r)));
  console.log(`📥 To insert after DB dedup: ${toInsert.length} (filtered ${deduped.length - toInsert.length} already in DB)`);

  if(toInsert.length===0){
    console.log("✅ Nothing to insert.");
    await mongoose.disconnect();
    process.exit(0);
  }

  const docs = toInsert.map(r=>({
    amount: r.amount,
    type: "EXPENSE",
    accountHead: r.headId,
    subType: r.subClean || undefined,
    paymentCategory: null,
    date: r.date,
    description: r.description,
    donorOrVendorName: r.donorOrVendorName,
    referenceNumber: r.referenceNumber,
    status: "VERIFIED",
    createdBy: admin._id,
    isSettled: false,
  }));

  // Insert in transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    const BATCH = 500;
    for(let i=0;i<docs.length;i+= BATCH){
      const chunk = docs.slice(i, i+BATCH);
      await Transaction.insertMany(chunk, {ordered:true, session} as any);
    }
    await session.commitTransaction();
    console.log(`✅ Inserted ${docs.length} historical expenses (VERIFIED)`);
  }catch(e:any){
    await session.abortTransaction();
    console.error("❌ Bulk insert failed:", e.message);
    throw e;
  }finally{
    session.endSession();
  }

  await mongoose.disconnect();
  console.log("✅ Done");
  process.exit(0);
}

main().catch(e=>{
  console.error(e);
  if(mongoose.connection.readyState) mongoose.disconnect();
  process.exit(1);
});
