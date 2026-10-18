import {Home,HeartHandshake,Sparkles,Wallet} from "lucide-react";

/** Only four primary experiences. Existing specialist routes retain their URLs
 * and data, but belong to the appropriate pillar instead of becoming new tabs.
 */
export const familyDestinations=[
 {id:"today",to:"/" as const,en:"Family World",ar:"عالم العيلة",shortEn:"World",shortAr:"العالم",icon:Home,accent:"#E58C65",soft:"#FFF0E6"},
 {id:"money",to:"/money" as const,en:"Our Money",ar:"ماليتنا",shortEn:"Money",shortAr:"المال",icon:Wallet,accent:"#2D917C",soft:"#E9F7F2"},
 {id:"family",to:"/family" as const,en:"Family Life",ar:"حياة العيلة",shortEn:"Family",shortAr:"العيلة",icon:HeartHandshake,accent:"#CB6393",soft:"#FCECF2"},
 {id:"ask",to:"/advisor" as const,en:"Ask Dabberna",ar:"اسأل دبّرنا",shortEn:"Ask",shortAr:"اسأل",icon:Sparkles,accent:"#9372CB",soft:"#F4EEFF"}
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
