import type {Member} from "./money";
import {memberAgeYears} from "./familyBirthdays";
import {realFamilyMembers} from "./familySetup";

export type DiscoveryPriority="quality"|"balance"|"affordable";
export type ActivityTheme={
 id:string; minAge:number;maxAge:number;
 en:string;ar:string; term:string;icon:string;
 tags:("free-search"|"sport"|"arts"|"learning"|"family")[];
};
/** Search themes, NOT events, vetted providers, priced services or guaranteed availability. */
export const ACTIVITY_THEMES:readonly ActivityTheme[]=[
 {id:"toddler",minAge:0,maxAge:4,en:"Parent & toddler play",ar:"لعب الأهل مع الصغار",term:"parent toddler sensory play",icon:"🧸",tags:["family"]},
 {id:"parks",minAge:0,maxAge:18,en:"Parks & open-air family time",ar:"حدائق ونزهات عائلية",term:"public family parks playgrounds",icon:"🌳",tags:["free-search","family"]},
 {id:"swim",minAge:3,maxAge:16,en:"Swimming programmes",ar:"دروس السباحة",term:"children swimming lessons",icon:"🏊",tags:["sport"]},
 {id:"art",minAge:4,maxAge:15,en:"Creative arts workshops",ar:"ورش الفنون",term:"children art workshops",icon:"🎨",tags:["arts"]},
 {id:"football",minAge:5,maxAge:17,en:"Football & sports academies",ar:"كرة القدم والأكاديميات الرياضية",term:"junior football sports academy",icon:"⚽",tags:["sport"]},
 {id:"library",minAge:2,maxAge:18,en:"Libraries & reading spaces",ar:"مكتبات ومساحات قراءة",term:"public libraries children events",icon:"📚",tags:["free-search","learning"]},
 {id:"robotics",minAge:9,maxAge:18,en:"Robotics & coding workshops",ar:"روبوتات وبرمجة",term:"youth robotics coding classes",icon:"🤖",tags:["learning"]},
 {id:"teen",minAge:13,maxAge:18,en:"Teen skills & creative courses",ar:"مهارات ودورات للشباب",term:"teenagers skills photography technology classes",icon:"🎯",tags:["learning","arts"]}
];
export function childAgeOptions(members:readonly Member[],asOf=new Date()):number[]{
 return Array.from(new Set(realFamilyMembers(members)
 .filter(m=>m.role==="child"&&memberAgeYears(m,asOf)!==null&&memberAgeYears(m,asOf)!<=18)
 .map(m=>memberAgeYears(m,asOf)!))).sort((a,b)=>a-b);
}
export function suggestedActivityThemes(
 age:number|null,priority:DiscoveryPriority="balance",freeFirst=false,
):ActivityTheme[]{
 const matched=ACTIVITY_THEMES.filter(x=>age===null||(Number.isInteger(age)&&age>=x.minAge&&age<=x.maxAge));
 const order=(x:ActivityTheme)=>{
  let score=x.tags.includes("family")?4:0;
  if(freeFirst||priority==="affordable")score+=x.tags.includes("free-search")?20:0;
  if(priority==="quality")score+=x.tags.includes("learning")?5:0;
  if(priority==="balance")score+=x.tags.includes("sport")?3:0;
  return score;
 };
 return matched.slice().sort((a,b)=>order(b)-order(a));
}
/** An external discovery query, never a claim that a class/date/price exists. */
export function activitySearchUrl(theme:ActivityTheme,city:string):string{
 const safeCity=city.trim().slice(0,70)||"Amman";
 return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(theme.term+" "+safeCity);
}
