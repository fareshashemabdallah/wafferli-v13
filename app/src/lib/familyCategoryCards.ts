import type {Category,CatType,MoneyState} from "./money";
import {categoryItemTotal} from "./householdBudgetBuilder";
import {roundJod} from "./cashflow";

/** Preset pictures are visual entry points, NOT six synthetic budgets.
 * Saved category IDs own all amounts, paid transactions and month overrides.
 */
export const CATEGORY_PICTURES=[
 {key:"groceries",en:"Groceries",ar:"المونة",icon:"🥦",bg:"#EAF5E7"},
 {key:"fuel",en:"Fuel",ar:"البنزين",icon:"⛽",bg:"#FFF5DE"},
 {key:"restaurants",en:"Restaurants",ar:"المطاعم",icon:"🍕",bg:"#FFEAF0"},
 {key:"children",en:"Children",ar:"الأولاد",icon:"🎒",bg:"#F8ECF7"},
 {key:"housing",en:"Housing",ar:"البيت",icon:"🏡",bg:"#EAF2FA"},
 {key:"health",en:"Health",ar:"الصحة",icon:"💗",bg:"#FFEFF5"},
 {key:"education",en:"School & education",ar:"المدرسة والتعليم",icon:"📚",bg:"#EEEAFB"},
 {key:"utilities",en:"Utilities",ar:"الخدمات والفواتير",icon:"💡",bg:"#FFF3DB"},
 {key:"gifts",en:"Gifts",ar:"الهدايا",icon:"🎁",bg:"#FFF0EF"},
 {key:"travel",en:"Holidays",ar:"العطل والسفر",icon:"🧳",bg:"#EAF5FA"},
 {key:"household",en:"Household help",ar:"مساعدة البيت",icon:"🧹",bg:"#E8F6F0"},
 {key:"clothing",en:"Clothing",ar:"الملابس",icon:"👕",bg:"#F4EEFC"},
 {key:"other",en:"Other",ar:"أخرى",icon:"✨",bg:"#F1F4ED"}
] as const;
export type CategoryPicture=typeof CATEGORY_PICTURES[number]["key"];
export type CategoryVisualGroup=CategoryPicture|"custom";
export const STARTER_PICTURES=CATEGORY_PICTURES.slice(0,6);
const known=new Set<string>(CATEGORY_PICTURES.map(p=>p.key));
export function pictureFor(key:CategoryPicture){return CATEGORY_PICTURES.find(p=>p.key===key)??CATEGORY_PICTURES[CATEGORY_PICTURES.length-1]!;}

/** Compatibility for old category records; once edited, visualGroup is saved
 * explicitly so changing "Groceries" to "Supermarket" won't lose its picture.
 */
export function visualGroupOf(category:Category):CategoryVisualGroup{
 if(category.visualGroup==="custom")return "custom";
 if(category.visualGroup&&known.has(category.visualGroup))return category.visualGroup;
 const v=(category.name+" "+category.id).toLowerCase();
 if(/groc|food|supermarket|market|بقال|مونة|طعام|أكل/.test(v))return "groceries";
 if(/fuel|transport|petrol|benzin|gasoline|بنزين|وقود|مواصل|نقل/.test(v))return "fuel";
 if(/restaurant|eating out|dining|takeaway|مطعم|مطاعم|طلعات|أكل برا/.test(v))return "restaurants";
 if(/child|kid|طفل|أطفال|أولاد|أولادنا/.test(v))return "children";
 if(/rent|housing|home|mortgage|إيجار|منزل|سكن|بيت|رهن/.test(v))return "housing";
 if(/health|medical|doctor|dent|طب|صحة|علاج|صيدل/.test(v))return "health";
 return "custom";
}
export function iconForCategory(category:Category):CategoryPicture{
 if(category.visualIcon&&known.has(category.visualIcon))return category.visualIcon;
 const group=visualGroupOf(category);
 if(group!=="custom")return group;
 const v=(category.name+" "+category.id).toLowerCase();
 if(/school|education|tuition|fees|درس|مدرس|تعليم|جامعة/.test(v))return "education";
 if(/electric|water|internet|utility|phone|كهرب|مياه|فاتور|إنترنت/.test(v))return "utilities";
 if(/gift|birthday|هدية|هدايا|ميلاد/.test(v))return "gifts";
 if(/holiday|travel|trip|vacation|سفر|عطل|رحلة/.test(v))return "travel";
 if(/nanny|helper|cleaner|maid|مربية|مساعدة|عاملة|تنظيف/.test(v))return "household";
 if(/cloth|dress|fashion|ملابس|ألبسة/.test(v))return "clothing";
 return "other";
}
export function pictureCategories(state:MoneyState,key:CategoryPicture){
 return state.categories.filter(cat=>visualGroupOf(cat)===key);
}
export type CategoryDraft={
 id?:string;name:string;planned:number;type:CatType;
 priority?:Category["priority"];visualGroup:CategoryVisualGroup;visualIcon:CategoryPicture;
};
export type CategoryEditResult={ok:true;state:MoneyState;categoryId:string}|{ok:false;reason:
 "demo"|"name"|"duplicate"|"amount"|"item-minimum"|"missing"|"limit"};
const validNumber=(n:unknown):n is number=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=100000&&
 Math.abs(n*100-Math.round(n*100))<=0.000001;
/** Data hygiene for the October category-group pilot. Previous categories
 * carried role and cadence, but the canonical model now stores both at the
 * budget-item line. Preserve all other category fields and every transaction. */
function withoutOldCategoryRole(cat:Category):Category{
 const {spendingRole:_oldRole,expectedCadence:_oldCadence,...rest}=cat as Category&
  {spendingRole?:string;expectedCadence?:string};
 return rest;
}
export function cleanOldCategoryRoles(state:MoneyState):MoneyState{
 if(!state.categories.some(c=>"spendingRole" in c||"expectedCadence" in c))return state;
 return {...state,categories:state.categories.map(withoutOldCategoryRole)};
}
/** One canonical category record. Renames preserve the ID and every linked
 * bill, expense, detailed item, pace and month-specific allowance.
 */
export function saveFamilyCategory(state:MoneyState,draft:CategoryDraft,newId:string):CategoryEditResult{
 if(state.demo)return {ok:false,reason:"demo"};
 const name=draft.name.trim().replace(/\s+/g," ");
 if(name.length<1||name.length>40)return {ok:false,reason:"name"};
 if(!validNumber(draft.planned)||!["fixed","variable","periodic"].includes(draft.type)||
  !
    (draft.visualGroup==="custom"||known.has(draft.visualGroup))||!known.has(draft.visualIcon))return {ok:false,reason:"amount"};
 if(state.categories.some(c=>c.id!==draft.id&&c.name.trim().toLocaleLowerCase()===name.toLocaleLowerCase()))
  return {ok:false,reason:"duplicate"};
 const existing=draft.id?state.categories.find(c=>c.id===draft.id):undefined;
 if(draft.id&&!existing)return {ok:false,reason:"missing"};
 if(!draft.id&&(state.categories.length>=100||!newId||state.categories.some(c=>c.id===newId)))
  return {ok:false,reason:"limit"};
 const categoryId=existing?.id??newId;
 if(draft.planned<categoryItemTotal(state.budgetItems??[],categoryId))
  return {ok:false,reason:"item-minimum"};
 // Drop the redundant category-level fields from the previous pilot schema.
 // All financial nature classifications now live on budget item lines.
 const safeExisting=existing?withoutOldCategoryRole(existing):{id:categoryId};
 const saved:Category={
  ...safeExisting,id:categoryId,name,
  planned:roundJod(draft.planned),type:draft.type,
  visualGroup:draft.visualGroup,visualIcon:draft.visualIcon,amountConfidence:"confirmed",
  ...(draft.priority?{priority:draft.priority}:{})
 };
 if(!draft.priority)delete saved.priority;
 return {ok:true,categoryId,state:{...state,
  hiddenStarterGroups:(state.hiddenStarterGroups??[]).filter(g=>g!==saved.visualGroup),
  categories:existing?
  state.categories.map(c=>c.id===categoryId?saved:c):[...state.categories,saved]}};
}
