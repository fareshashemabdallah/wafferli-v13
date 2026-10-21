import type {Member} from "./money";
import {realFamilyMembers} from "./familySetup";
import {memberAgeYears} from "./familyBirthdays";

export type DiscoverKind="all"|"park"|"playground"|"museum"|"attraction"|"arts centre";
export const QUICK_DISCOVERY_KEY="oneTapDiscoverIntent";
export type QuickDiscoveryIntent={kind:DiscoverKind;requestedAt:number};
const VALID_KINDS:DiscoverKind[]=["all","park","playground","museum","attraction","arts centre"];
export function isFreshQuickDiscoveryIntent(value:unknown,now=Date.now()):value is QuickDiscoveryIntent{
 if(!value||typeof value!=="object")return false;
 const x=value as Partial<QuickDiscoveryIntent>;
 return VALID_KINDS.includes(x.kind as DiscoverKind)&&typeof x.requestedAt==="number"&&
  Number.isFinite(x.requestedAt)&&now>=x.requestedAt&&now-x.requestedAt<5*60*1000;
}
export type FamilyInspiration={
 kind:DiscoverKind;titleEn:string;titleAr:string;
 contextEn:string;contextAr:string;
 agesKnown:boolean;
};
/** A gentle idea based only on *saved* ages. It is NOT a venue recommendation,
 * safety assessment, live event, budget or verified suitability. The parent
 * chooses whether to run the public, category-only city map search. */
export function suggestLowEffortFamilyIdea(members:readonly Member[],now=new Date()):FamilyInspiration{
 const children=realFamilyMembers(members).filter(m=>m.role==="child");
 const ages=children.map(m=>memberAgeYears(m,now))
  .filter((v):v is number=>v!==null&&v>=0&&v<=18);
 const agesKnown=children.length>0&&ages.length===children.length;
 if(agesKnown&&ages.length&&ages.every(age=>age>=13))
  return {kind:"museum",agesKnown,titleEn:"Explore something new together",
   titleAr:"اكتشفوا شي جديد سوا",
   contextEn:"A museum or discovery outing could be a conversation starter for your teenagers. Check admission, hours and fit first.",
   contextAr:"زيارة متحف أو نشاط استكشاف ممكن تناسب المراهقين. تأكد من العمر والدوام والدخول أولاً."};
 if(agesKnown&&ages.length&&ages.every(age=>age<=2))
  return {kind:"park",agesKnown,titleEn:"A gentle change of scene?",
   titleAr:"تغيير جو بسيط مع الصغار؟",
   contextEn:"Look for an open-air family option. Toddlers need close adult supervision; suitability, access and facilities aren't verified.",
   contextAr:"جرّبوا خيار عائلي بالهواء الطلق. الصغار بحاجة لإشراف مباشر، وملاءمة المكان والخدمات غير مؤكدة."};
 if(agesKnown&&ages.some(age=>age<=2)&&ages.some(age=>age>=13))
  return {kind:"park",agesKnown,titleEn:"An idea for different ages",
   titleAr:"فكرة تناسب أعمار مختلفة",
   contextEn:"Try an open-air family option you can adapt for both toddlers and teenagers. Check each child's needs before you go.",
   contextAr:"جربوا فكرة عائلية بالخارج ممكن تتكيف مع الصغار والمراهقين. راجع احتياجات كل طفل قبل الطلعة."};
 return {kind:"park",agesKnown,titleEn:"How about time outdoors?",
  titleAr:"شو رأيكم بوقت برا البيت؟",
  contextEn:agesKnown?"Explore open-air family options using your saved age context. Check practical details yourself.":
   "Explore a few family options without setting up a profile or entering your income. You decide what's suitable.",
  contextAr:agesKnown?"اكتشفوا خيارات عائلية بالخارج بحسب الأعمار المحفوظة. تأكد من تفاصيل المكان بنفسك.":
   "شوف خيارات للعيلة بلا إعداد حسابات أو إدخال دخل. إنت بتختار المناسب."};
}
