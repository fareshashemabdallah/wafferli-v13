import {z} from "zod";
import {LOCAL_APP_KEYS,type LocalBackup} from "./localDataControls";

/**
 * Safe local-only recovery of vetted version-1 backup sections.
 * Restoring never authenticates, connects Supabase or uploads any field.
 * Outing admin/vote tokens and other unreviewed modules are EXCLUDED.
 */
export const RESTORABLE_KEYS=[
 "money","members","householdPresence","familyCalendar","familyPreferences","familyPlans","shopping","moneyMonthReviews",
 "privateQuoteRequests","privateServiceShortlist","familyTasks","familyWishlist","privateOutingOptions"
] as const;
export type RestorableKey=typeof RESTORABLE_KEYS[number];
const PREFIX="wafferli.v13.";
const MAX_BACKUP_BYTES=5_000_000;
const maxNumber=z.number().finite().min(0).max(1_000_000_000);
const cash=maxNumber.nullable();
const text=z.string().max(4000);
const id=z.string().min(1).max(180);
const isoDate=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>{
 const parts=s.split("-").map(Number);
 const date=new Date(Date.UTC(parts[0]!,parts[1]!-1,parts[2]!));
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===s;
},"Invalid calendar date");
const isoTime=z.string().max(50).refine(s=>Number.isFinite(Date.parse(s)),"Invalid timestamp");
const many=<T extends z.ZodTypeAny>(schema:T,max=3000)=>z.array(schema).max(max);
const opts=(v:z.ZodRawShape)=>z.object(v).passthrough();
const numMap=z.record(maxNumber);
// New decision records are strictly shaped: no hidden tokens or unexpected
// nested properties may pass into device restoration or the staged vault.
const strict=(shape:z.ZodRawShape)=>z.object(shape).strict();
const smallMoney=z.number().finite().min(0).max(100000)
 .refine(n=>Math.abs(n*100-Math.round(n*100))<=0.00001,"JOD must have two decimal places");
const positiveSmallMoney=smallMoney.refine(n=>n>0,"Positive amount required");
const url=z.string().max(700).refine(raw=>{
 try{const parsed=new URL(raw);return parsed.protocol==="https:"&&!parsed.username&&!parsed.password&&
  parsed.hostname.includes(".")&&!parsed.hostname.endsWith(".local")&&
  !/^127\./.test(parsed.hostname);}catch{return false;}
},"Public HTTPS URL required");
const expense=opts({
 id, date:isoDate, categoryId:id, budgetItemId:id.optional(), amount:maxNumber,
 shared:z.boolean(),status:z.enum(["planned","paid"]).optional(),
 note:text.optional(),owner:text.optional(),billId:id.optional(),dueDate:isoDate.optional(),
 cashDeducted:z.boolean().optional(),sourcePlanId:id.optional(),
 plannedAmount:maxNumber.optional(),varianceDismissed:z.boolean().optional(),
 allocation:opts({kind:z.enum(["variable","savings"]),categoryId:id.optional(),
  delta:z.number().finite().min(-1_000_000).max(1_000_000),
  approvedAt:isoTime}).optional()
});
const incomeSource=opts({
 id,name:text,amount:maxNumber,
 frequency:z.enum(["daily","weekly","biweekly","monthly","quarterly","yearly","once","irregular"]),
 nextDate:z.union([isoDate,z.literal("")]),endDate:isoDate.optional(),
 owner:text.optional(),shared:z.boolean(),variable:z.boolean().optional(),
 receivedDates:many(isoDate).optional(),receivedAmounts:numMap.optional()
});
const commitment=opts({
 id,name:text,amount:maxNumber,
 frequency:z.enum(["daily","weekly","biweekly","monthly","quarterly","yearly","once","irregular"]),
 dueDate:z.union([isoDate,z.literal("")]),endDate:isoDate.optional(),
 categoryId:id.optional(),paidDates:many(isoDate).optional()
});
const goal=opts({
 id,name:text,targetJod:maxNumber,savedJod:maxNumber,monthlyJod:maxNumber,
 createdAt:isoTime,updatedAt:isoTime,dueDate:isoDate.optional()
});
const schemas:Record<RestorableKey,z.ZodTypeAny>={
 householdPresence:strict({
  adults:z.number().int().min(0).max(50).nullable(),
  children:z.number().int().min(0).max(50).nullable(),
  helpers:many(strict({
   id,label:z.string().max(40),
   arrangement:z.enum(["live-in","daytime"]),
   count:z.number().int().min(1).max(20),
   salaryMonthly:smallMoney,foodDaily:smallMoney,
   workDaysMonthly:z.number().int().min(0).max(31),
   utilitiesMonthly:smallMoney,suppliesMonthly:smallMoney
  }),20),
  guests:many(strict({
   id,label:z.string().max(40),
   pattern:z.enum(["one-off","monthly","permanent"]),
   count:z.number().int().min(1).max(30),
   startDate:z.union([isoDate,z.literal("")]),
   endDate:z.union([isoDate,z.literal("")]),
   daysMonthly:z.number().int().min(0).max(31),
   foodDaily:smallMoney,utilitiesDaily:smallMoney,otherDaily:smallMoney
  }).refine(g=>g["pattern"]!=="one-off"||
    (!!g["startDate"]&&!!g["endDate"]&&g["startDate"]<=g["endDate"]),
    "A dated visit must have valid arrival and departure dates"),100)
 }),
 money:opts({
  income:maxNumber,savingsPct:maxNumber,
  budgetItems:many(z.object({
   id,name:z.string().min(1).max(90),categoryId:id,enabled:z.boolean(),
   amountJod:smallMoney,frequency:z.enum(["monthly","weekly","quarterly","yearly"]),
   behaviour:z.enum(["fixed","variable"]),
   priority:z.enum(["essential","protected","flexible"]),
   quantity:smallMoney.optional(),unitPriceJod:smallMoney.optional(),
   unitLabel:z.string().max(40).optional(),priceSource:url.optional(),
   priceCheckedMonth:z.string().regex(/^\\d{4}-\\d{2}$/).optional()
  }).strict(),500).optional(),
  categories:many(opts({
   id,name:text,type:z.enum(["fixed","variable","periodic"]),planned:maxNumber
  })),expenses:many(expense),demo:z.boolean(),
  incomeSources:many(incomeSource).optional(),commitments:many(commitment).optional(),
  cashOnHand:cash.optional(),cashReserve:maxNumber.optional(),cashUpdatedAt:isoDate.optional(),
  savingsTargetAmount:maxNumber.optional(),financialInputsPartial:z.boolean().optional(),
  monthlyAdjustments:z.record(opts({
   savingsDelta:z.number().finite().min(-1_000_000).max(1_000_000),
   categoryDeltas:z.record(z.number().finite().min(-1_000_000).max(1_000_000))
  })).optional(),
  savingsGoals:many(goal).optional(),noBillsConfirmedMonth:z.string().regex(/^\d{4}-\d{2}$/).optional()
 }),
 members:many(opts({
  id,name:z.string().min(1).max(200),role:z.enum(["adult","child"]),
  ageGroup:z.string().max(80),prefs:text,birthday:isoDate.optional(),
  birthdayMonthDay:z.string().regex(/^\\d{2}-\\d{2}$/).optional(),
  ageYears:z.number().int().min(0).max(120).optional()
 }),100),
 familyCalendar:many(opts({
  id,title:z.string().min(1).max(300),date:isoDate,
  kind:z.enum(["birthday","anniversary","holiday","celebration","school","activity","other"]),
  annual:z.boolean(),note:text.optional(),time:z.string().max(12).optional()
 }),1000),
 familyPreferences:opts({
  weather:z.boolean(),lifestyle:z.boolean(),financeTips:z.boolean(),
  billReminders:z.boolean(),shoppingTips:z.boolean(),
  notificationFrequency:z.enum(["off","important","gentle"]),
  experienceMode:z.enum(["auto","individual","family"]).optional(),
  typicalChildrenAttendance:z.enum(["ask","yes","no"]).optional(),
  typicalOutingFocus:z.enum(["children","mixed","adults"]).optional(),
  city:z.string().max(100),distanceKm:maxNumber,outingLimit:maxNumber,
  discoveryPriority:z.enum(["quality","balance","affordable"]).optional(),
  freeActivitiesFirst:z.boolean().optional(),
  activityGroupPreference:z.enum(["any","girls","boys","separate"]).optional(),
  instructorPreference:z.enum(["any","female","male"]).optional(),
  parentCanObservePreferred:z.boolean().optional(),
  moneyJourneyFocus:z.enum(["understand","protect","prepare","live"]).optional(),
  moneyJourneyLastReviewedWeek:isoDate.optional(),
  protectedFamilyValues:many(z.enum(["education","development","family-time","health","traditions","security","experiences"]),7).optional(),
  decisionLearningEnabled:z.boolean().optional(),
  decisionFeedback:z.record(z.record(z.number().int().min(0).max(1000))).optional()
 }),
 familyPlans:many(opts({
  id,title:z.string().min(1).max(300),
  kind:z.enum(["purchase","outing","occasion","other"]),
  status:z.enum(["planning","decided","completed"]),
  createdAt:isoTime,updatedAt:isoTime,date:isoDate.optional(),
  budgetJod:maxNumber.optional(),actualJod:maxNumber.optional(),
  completedAt:isoTime.optional(),expenseId:id.optional(),
  note:text.optional(),sourceRef:text.optional(),savingsGoalId:id.optional(),
  choice:opts({label:text,estimatedJod:maxNumber.optional(),
   source:z.enum(["comparison","outing","occasion","manual"]),verified:z.boolean().optional()}).optional()
 }),1500),
 shopping:many(opts({
  id,name:z.string().min(1).max(200),
  qty:z.number().int().min(1).max(10000),price:maxNumber,done:z.boolean()
 }),1500),
 privateQuoteRequests:many(strict({
  id:z.string().min(1).max(120),createdAt:isoTime,
  status:z.enum(["draft","shared-by-user","closed"]),
  request:strict({
   product:z.string().min(3).max(100),quantity:z.number().int().min(1).max(10000),
   deliveryCity:z.string().min(2).max(70),neededBy:isoDate,
   budgetCeilingJod:positiveSmallMoney.optional()
  }),
  offers:many(strict({
   id:z.string().min(1).max(120),merchant:z.string().min(2).max(90),
   itemCostJod:positiveSmallMoney,deliveryJod:smallMoney,taxesJod:smallMoney,
   enteredAt:isoTime,expiresOn:isoDate,
   evidenceUrl:url.optional(),note:z.string().max(250).optional()
  }),20)
 }),30),
 moneyMonthReviews:many(strict({
  month:z.string().regex(/^\d{4}-\d{2}$/).refine(m=>{const d=new Date(m+"-01T12:00:00Z");return Number.isFinite(d.getTime())&&d.toISOString().slice(0,7)===m;}),
  reviewedAt:isoTime,revision:z.string().regex(/^[a-f0-9]{16}$/),
  paidCount:z.number().int().min(0).max(10000),enteredSpendJod:maxNumber,
  capturedPlanJod:maxNumber
 }),24),
 familyWishlist:many(strict({
  id:z.string().min(1).max(130),name:z.string().min(2).max(120),
  kind:z.enum(["gift","household","children","other"]),
  status:z.enum(["considering","purchased","removed"]),
  createdAt:isoTime,updatedAt:isoTime,targetDate:isoDate.optional(),
  budgetJod:smallMoney.optional(),recipientLabel:z.string().max(60).optional(),
  note:z.string().max(240).optional(),repeatMonths:z.union([z.literal(1),z.literal(3),z.literal(6),z.literal(12)]).optional(),
  repeatAnchorDate:isoDate.optional(),lastPurchasedOn:isoDate.optional(),
  prices:many(strict({id:z.string().min(1).max(130),amountJod:positiveSmallMoney,
    checkedAt:isoDate,store:z.string().min(2).max(90),sourceUrl:url.optional()}),24)
 }),150),
 privateOutingOptions:many(strict({
  id:z.string().min(1).max(130),name:z.string().min(2).max(110),
  kind:z.enum(["indoor","outdoor","mixed"]),checkedOn:isoDate,
  totalEstimatedJod:smallMoney.optional(),distanceKm:z.number().finite().min(0).max(2000).optional(),
  childAdmission:z.enum(["yes","no","unknown"]),ageFit:z.enum(["yes","no","unknown"]),
  accessible:z.enum(["yes","no","unknown"]),noise:z.enum(["quiet","loud","unknown"]),
  note:z.string().max(200).optional()
 }),50),
 familyTasks:many(strict({
  id:z.string().min(1).max(130),title:z.string().min(1).max(140),dueDate:isoDate,
  priority:z.enum(["high","normal","low"]),status:z.enum(["open","done"]),
  createdAt:isoTime,updatedAt:isoTime,
  ownerMemberId:z.string().max(130).optional(),planId:z.string().max(130).optional(),
  note:z.string().max(300).optional(),completedAt:isoTime.optional()
 }),250),
 privateServiceShortlist:many(strict({
  id:z.string().min(1).max(120),category:z.enum(["doctor","school","home","activities","gifts"]),
  name:z.string().min(2).max(110),city:z.string().min(2).max(75),
  checkedAt:isoDate,costJod:smallMoney.optional(),sourceUrl:url.optional(),
  parentFit:z.number().int().min(1).max(5).optional(),
  childFriendly:z.boolean().optional(),stepFreeAccess:z.boolean().optional(),
  credentialsConfirmedByParent:z.boolean().optional(),
  availabilityConfirmedByParent:z.boolean().optional(),
  note:z.string().max(250).optional()
 }),100)
};
const root=z.object({
 app:z.literal("dabberna"),schemaVersion:z.literal(1),
 exportedAt:isoTime,storage:z.literal("browser-local"),
 warning:z.string().max(2000),entries:z.record(z.unknown())
});
const record=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==="object"&&!Array.isArray(x);
const deepSafe=(value:unknown,depth=0):boolean=>{
 if(depth>18)return false;
 if(value===null||typeof value==="boolean")return true;
 if(typeof value==="number")return Number.isFinite(value);
 if(typeof value==="string")return value.length<=20000;
 if(Array.isArray(value))return value.length<=4000&&value.every(x=>deepSafe(x,depth+1));
 if(!record(value))return false;
 const keys=Object.keys(value);
 return keys.length<=1200&&keys.every(k=>
  k.length<=150&&!["__proto__","prototype","constructor"].includes(k)&&deepSafe(value[k],depth+1));
};
const uniqueIds=(list:unknown):boolean=>{
 if(!Array.isArray(list))return true;
 const ids=list.map(x=>record(x)?x["id"]:undefined);
 return ids.every(x=>typeof x==="string")&&new Set(ids).size===ids.length;
};
const summarize=(v:unknown)=>Array.isArray(v)?v.length:null;
export type RecoverySection={
 key:RestorableKey;
 label:string;
 count:number|null;
 currentlyStored:boolean;
};
export type RecoveryPreview={
 exportedAt:string;
 sections:RecoverySection[];
 skipped:string[];
 /** Raw normalized JSON strings, not a payload for the network. */
 values:Partial<Record<RestorableKey,string>>;
 /** The exact local versions checked during the preview, for race protection. */
 before:Partial<Record<RestorableKey,string|null>>;
};
const labels:Record<RestorableKey,string>={
 money:"Money: budgets, spending, bills and goals",
 householdPresence:"People in our home: helpers and visitors",
 members:"Family profiles",
 familyCalendar:"Family calendar",
 familyPreferences:"Family preferences",
 familyPlans:"Family plans",
 shopping:"Shopping list",
 privateQuoteRequests:"Private quotation drafts and entered offers",
 privateServiceShortlist:"Private family-service comparison notes",
 familyTasks:"Parent-managed family responsibilities",
 familyWishlist:"Family gift and purchase wishlists with price checks",
 moneyMonthReviews:"Parent-reviewed historical spending entries and captured budget envelopes",
 privateOutingOptions:"Private parent-reviewed outing comparisons"
};
/** Parsing a file never writes to local storage. The original backup export
 * contains more modules than this validator can safely restore; these appear
 * as explicit skipped sections, never silently imported.
 */
export function inspectLocalBackup(
 raw:string,storage:Pick<Storage,"getItem">
):RecoveryPreview{
 if(raw.length>MAX_BACKUP_BYTES)throw new Error("Backup is too large (5 MB limit)");
 let input:unknown;
 try{input=JSON.parse(raw) as unknown;}
 catch{throw new Error("This is not a valid JSON backup");}
 const parsed=root.safeParse(input);
 if(!parsed.success)throw new Error("Unsupported backup file or schema version");
 if(!deepSafe(input))throw new Error("Backup contains unsafe or excessively complex data");
 const entries=parsed.data.entries;
 const all=Object.keys(entries);
 if(!all.length)throw new Error("Backup is empty");
 if(all.length>LOCAL_APP_KEYS.length)throw new Error("Backup includes unexpected sections");
 const allowed=new Set<string>(LOCAL_APP_KEYS);
 if(all.some(k=>!allowed.has(k)))throw new Error("Backup contains unrecognized data sections");
 const sections:RecoverySection[]=[];
 const skipped:string[]=[];
 const values:RecoveryPreview["values"]={};
 const before:RecoveryPreview["before"]={};
 for(const key of all){
  if(!RESTORABLE_KEYS.includes(key as RestorableKey)){
   skipped.push(key);continue;
  }
  const typed=key as RestorableKey;
  const result=schemas[typed].safeParse(entries[key]);
  if(!result.success)throw new Error("Backup has invalid "+typed+" data; no changes were made");
  const payload=entries[key];
  if(["members","familyCalendar","familyPlans","shopping","privateQuoteRequests","privateServiceShortlist","familyTasks","familyWishlist","privateOutingOptions"].includes(typed)&&!uniqueIds(payload))
   throw new Error("Duplicate item IDs in "+typed+"; no changes were made");
  if(typed==="money"&&record(payload)&&payload["budgetItems"]!==undefined&&
    !uniqueIds(payload["budgetItems"]))
    throw new Error("Duplicate budget item IDs; no changes were made");
  if(typed==="householdPresence"&&record(payload)&&
   (!uniqueIds(payload["helpers"])||!uniqueIds(payload["guests"])))
   throw new Error("Duplicate helper or visitor IDs; no changes were made");
  if(typed==="moneyMonthReviews"&&Array.isArray(payload)&&new Set(payload.filter(record).map(x=>x["month"])).size!==payload.length)
   throw new Error("Duplicate months in moneyMonthReviews; no changes were made");
  if(typed==="familyWishlist"&&Array.isArray(payload)&&payload.some(item=>record(item)&&!uniqueIds(item["prices"])))
   throw new Error("Duplicate price IDs in familyWishlist; no changes were made");
  if(typed==="privateQuoteRequests"&&Array.isArray(payload)&&payload.some(q=>
   record(q)&&!uniqueIds(q["offers"])))
   throw new Error("Duplicate offer IDs in privateQuoteRequests; no changes were made");
  // Reject archived secrets masquerading as future fields; the app never
  // needs login credentials to reconstruct Money or a family profile.
  const normalized=JSON.stringify(payload);
  if(normalized.length>2_000_000)throw new Error("Backup section exceeds the storage limit");
  values[typed]=normalized;
  const previous=storage.getItem(PREFIX+typed);
  before[typed]=previous;
  sections.push({
   key:typed,label:labels[typed],count:summarize(payload),currentlyStored:previous!==null
  });
 }
 if(!sections.length)throw new Error("This backup contains no compatible sections");
 return {exportedAt:parsed.data.exportedAt,sections,skipped,values,before};
}
export type RestoreResult={restored:RestorableKey[]; rolledBack:false};
/** Atomic as far as Web Storage permits: preflight size, snapshot existing
 * entries, write+read verify, then roll back every touched key on any failure.
 * Refuse to overwrite data modified in another tab after preview.
 */
export function restoreLocalSections(
 storage:Pick<Storage,"getItem"|"setItem"|"removeItem">,
 preview:RecoveryPreview,chosen:readonly RestorableKey[],
 explicitConsent:boolean
):RestoreResult{
 if(explicitConsent!==true)throw new Error("Explicit restore consent is required");
 const selected=[...new Set(chosen)];
 if(!selected.length)throw new Error("Select at least one section to restore");
 if(selected.some(key=>!(key in preview.values)||!(key in preview.before)))
  throw new Error("Selected section was not validated");
 const entries=selected.map(key=>{
  const current=storage.getItem(PREFIX+key);
  if(current!==preview.before[key])throw new Error(
   "Saved data changed since preview. Review the backup again before restoring");
  return {key,full:PREFIX+key,previous:current,next:preview.values[key]!};
 });
 const touched:typeof entries=[];
 try{
  for(const e of entries){
   touched.push(e);
   storage.setItem(e.full,e.next);
   if(storage.getItem(e.full)!==e.next)throw new Error("Browser refused to save a restored section");
  }
 }catch(err){
  let rollbackFailed=false;
  for(const e of touched.reverse()){
   try{
    if(e.previous===null)storage.removeItem(e.full);
    else storage.setItem(e.full,e.previous);
    if(storage.getItem(e.full)!==e.previous)rollbackFailed=true;
   }catch{rollbackFailed=true;}
  }
  if(rollbackFailed)throw new Error(
   "Restore failed and rollback was incomplete. Use your downloaded safety backup.");
  throw new Error("Restore cancelled: browser storage failed; original values were restored.");
 }
 return {restored:selected,rolledBack:false};
}
