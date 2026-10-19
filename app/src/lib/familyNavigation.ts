import {Home,HeartHandshake,Sparkles,Wallet} from "lucide-react";

/** Only four primary experiences. Existing specialist routes retain their URLs
 * and data, but belong to the appropriate pillar instead of becoming new tabs.
 */
/** Consistent movement through one family journey. Tools remain available at their existing URLs. */
export const familyDestinations=[
 {id:"today",to:"/" as const,en:"Today",ar:"اليوم",shortEn:"Today",shortAr:"اليوم",icon:Home,accent:"#338C70",soft:"#E5F4E9"},
 {id:"money",to:"/money" as const,en:"Understand",ar:"افهم المال",shortEn:"Money",shortAr:"المال",icon:Wallet,accent:"#2D917C",soft:"#E9F7F2"},
 {id:"ask",to:"/advisor" as const,en:"Decide",ar:"قرّر",shortEn:"Decide",shortAr:"قرّر",icon:Sparkles,accent:"#9372CB",soft:"#F4EEFF"},
 {id:"family",to:"/family" as const,en:"Plans & Life",ar:"خطط العيلة",shortEn:"Plans",shortAr:"الخطط",icon:HeartHandshake,accent:"#CB6393",soft:"#FCECF2"}
] as const;
export type FamilyArea=(typeof familyDestinations)[number]["id"];
export function areaFromRoute(path:string):FamilyArea{
 if(path==="/"||path==="")return "today";
 if(path.startsWith("/money")||path.startsWith("/household"))return "money";
 if(path.startsWith("/advisor"))return "ask";
 if(path.startsWith("/family")||path.startsWith("/plans")||
  path.startsWith("/calendar")||path.startsWith("/occasions")||
  path.startsWith("/space")||path.startsWith("/explore/together")||
  path.startsWith("/together/")||path.startsWith("/explore/weekend")||
  path.startsWith("/community")||path.startsWith("/experience")||
  path.startsWith("/vote/"))return "family";
 // Shopping is preserved as an optional specialist tool, not a main tab.
 if(path.startsWith("/explore"))return "today";
 return "today";
}
export function currentRoutePath(){
 if(typeof window==="undefined")return "/";
 const hash=window.location.hash.replace(/^#/,"").split("?")[0]??"/";
 return hash.startsWith("/")?hash:"/";
}
