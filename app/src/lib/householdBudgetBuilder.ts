import type {Category,Member,MoneyState} from "./money";
import {realFamilyMembers} from "./familySetup";
import {estimateHouseholdPresence,type HouseholdPresence} from "./householdPresence";

/** The Budget Builder is an optional breakdown of the EXISTING category envelope.
 * Never add this total to the category total or to recorded spending. */
export type ItemFrequency="monthly"|"weekly"|"quarterly"|"yearly";
export type BudgetItem={
 id:string;categoryId:string;name:string;enabled:boolean;
 amountJod:number;frequency:ItemFrequency;
 behaviour:"fixed"|"variable";priority:"essential"|"protected"|"flexible";
 quantity?:number;unitPriceJod?:number;unitLabel?:string;
 priceSource?:string;priceCheckedMonth?:string;
};
const r2=(n:number)=>Math.round(n*100)/100;
const nonnegative=(n:number)=>Number.isFinite(n)&&n>=0&&n<=100000;
export function monthlyItemCost(item:BudgetItem):number{
 if(!item.enabled)return 0;
 if(!nonnegative(item.amountJod))return 0;
 const base= item.quantity!==undefined&&item.unitPriceJod!==undefined&&
  nonnegative(item.quantity)&&nonnegative(item.unitPriceJod)?
  item.quantity*item.unitPriceJod:item.amountJod;
 const multiplier:Record<ItemFrequency,number>={monthly:1,weekly:52/12,quarterly:1/3,yearly:1/12};
 return r2(base*multiplier[item.frequency]);
}
export function categoryItemTotal(items:readonly BudgetItem[],id:string):number{
 return r2(items.filter(i=>i.categoryId===id).reduce((sum,i)=>sum+monthlyItemCost(i),0));
}
export function categoryUnallocated(state:MoneyState,id:string){
 const category=state.categories.find(c=>c.id===id);
 return r2((category?.planned??0)-categoryItemTotal(state.budgetItems??[],id));
}
/** Only a deliberate user action changes the existing category envelope. */
export function setCategoryPlanFromItems(state:MoneyState,id:string):MoneyState{
 const category=state.categories.find(c=>c.id===id);
 if(!category||state.demo)return state;
 const amount=categoryItemTotal(state.budgetItems??[],id);
 if(!nonnegative(amount))return state;
 return {...state,categories:state.categories.map(c=>c.id===id?{...c,planned:amount,amountConfidence:"estimate"}:c)};
}
export function upsertBudgetItem(state:MoneyState,item:BudgetItem):MoneyState{
 if(state.demo||!state.categories.some(c=>c.id===item.categoryId))return state;
 if(!item.id||!item.name.trim()||item.name.length>90||!nonnegative(item.amountJod)||
  (item.quantity!==undefined&&!nonnegative(item.quantity))||
  (item.unitPriceJod!==undefined&&!nonnegative(item.unitPriceJod)))return state;
 const items=state.budgetItems??[];
 return {...state,budgetItems:items.some(i=>i.id===item.id)?
  items.map(i=>i.id===item.id?item:i):[...items,item]};
}
export function removeBudgetItem(state:MoneyState,id:string):MoneyState{
 if(state.demo||!(state.budgetItems??[]).some(i=>i.id===id))return state;
 return {...state,budgetItems:(state.budgetItems??[]).filter(i=>i.id!==id)};
}

/** Only government-issued prices are tagged public; the rest are unpriced
 * templates. A unit price alone is NOT a family-spending benchmark. */
export const PUBLIC_JORDAN_UNIT_PRICES=[
 {key:"petrol90",name:"Petrol 90",category:"transport",priceJod:1.050,unit:"litre",
  checkedMonth:"2026-10",source:"https://memr.gov.jo/Ar/NewsDetails/2026093004"},
 {key:"cookinggas",name:"Cooking gas (12.5 kg cylinder)",category:"utilities",priceJod:7,
  unit:"cylinder",checkedMonth:"2026-10",source:"https://memr.gov.jo/Ar/NewsDetails/2026093004"}
] as const;
export type BudgetKind="housing"|"food"|"utilities"|"transport"|"health"|"education"|"outings"|"clothing"|"household"|"helper"|"other";
export function categoryKind(c:Category):BudgetKind{
 const v=(c.id+" "+c.name).toLowerCase();
 if(/rent|mortgage|housing|home loan|إيجار|سكن|رهن/.test(v))return "housing";
 if(/grocer|food|supermarket|meat|fruit|أكل|طعام|بقال|سوبر|تموين/.test(v))return "food";
 if(/electric|water|internet|utilit|gas\b|كهرب|مياه|إنترنت|غاز/.test(v))return "utilities";
 if(/transport|fuel|petrol|taxi|car|مواصل|بنزين|سيار|وقود|نقل/.test(v))return "transport";
 if(/medical|doctor|health|personal care|صيدل|طب|صحة|علاج/.test(v))return "health";
 if(/school|education|tuition|تعليم|مدرس|أقساط/.test(v))return "education";
 if(/eating out|outing|restaurant|leisure|entertain|طلعات|ترفيه|مطعم/.test(v))return "outings";
 if(/cloth|shoes|ملابس|أحذية/.test(v))return "clothing";
 if(/household|cleaning|supplies|منزل|تنظيف|مستلزمات/.test(v))return "household";
 if(/helper|nanny|domestic|maid|مربية|مساعدة/.test(v))return "helper";
 return "other";
}
export const BUDGET_TEMPLATES:Record<BudgetKind,readonly string[]>={
 housing:["Rent or mortgage","Building fees","Repairs & maintenance","Home insurance"],
 food:["Bread, rice & cereals","Meat, poultry & fish","Dairy & eggs","Vegetables & fruit","Pantry basics","Drinks & snacks"],
 utilities:["Electricity","Water","Home internet","Mobile plans","Cooking gas (12.5 kg cylinder)"],
 transport:["Petrol 90","Car maintenance","Car insurance & registration","Taxi or public transport","School transport"],
 health:["Medicines","Doctor visits","Health insurance","Dental & optical","Personal care"],
 education:["Tuition","School transport","Books & stationery","School uniforms","Activities & tutoring"],
 outings:["Restaurants & takeaway","Children's activities","Entertainment","Occasional treats"],
 clothing:["Adult clothing","Children's clothing","Shoes"],
 household:["Cleaning products","Laundry","Paper products","Small replacements"],
 helper:["Salary","Meals at home","Extra utilities","Personal supplies","Permits & insurance"],
 other:[]
};
/** Deliberately ILLUSTRATIVE household-consumption assumptions, not a 2026
 * official Amman average. Used only if household composition is known. */
const referenceAssumptions:Partial<Record<BudgetKind,{shared:number;adult:number;child:number}>>={
 food:{shared:25,adult:105,child:60},
 utilities:{shared:60,adult:18,child:8},
 transport:{shared:35,adult:70,child:12},
 health:{shared:0,adult:38,child:20},
 education:{shared:0,adult:0,child:35},
 outings:{shared:15,adult:42,child:18},
 clothing:{shared:5,adult:25,child:22},
 household:{shared:22,adult:8,child:6}
};
export type ReferenceEstimate={
 amountJod:number;basis:"illustrative";month:string;adults:number;children:number;
 explanation:string;officialUnits:typeof PUBLIC_JORDAN_UNIT_PRICES[number][];
};
/** An estimate is NOT an observation of what similar Amman families really spent.
 * No benchmark is supplied for housing, helper salaries or custom categories. */
export function householdCategoryReference(
 cat:Category,members:readonly Member[],presence:HouseholdPresence,month:string
):ReferenceEstimate|null{
 const kind=categoryKind(cat),coeff=referenceAssumptions[kind];
 if(!coeff||!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return null;
 const p=estimateHouseholdPresence(presence,members,month);
 const real=realFamilyMembers(members);
 const adults=p.adults??(real.length?real.filter(m=>m.role==="adult").length:null);
 const children=p.children??(real.length?real.filter(m=>m.role==="child").length:null);
 if(adults===null||children===null)return null;
 const additional=kind==="food"?p.helperFood+p.guestFood:
  kind==="utilities"?p.helperUtilities+p.guestUtilities:0;
 return {
  amountJod:r2(coeff.shared+adults*coeff.adult+children*coeff.child+additional),
  basis:"illustrative",month,adults,children,
  explanation:"Illustrative quantity assumptions; NOT a verified public-data spending average. Includes any separately entered helper/visitor food or utilities; beware of overlap with existing category plans.",
  officialUnits:PUBLIC_JORDAN_UNIT_PRICES.filter(x=>x.category===kind)
 };
}
