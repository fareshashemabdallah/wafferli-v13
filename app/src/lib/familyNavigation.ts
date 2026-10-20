import {Home,HeartHandshake,Wallet} from "lucide-react";

/** Three family areas. Ask is a persistent capability, never a compulsory
 * fourth chapter. The advisor and all specialist URLs remain functional. */
export const familyDestinations=[
 {id:"today",to:"/" as const,en:"Today",ar:"اليوم",shortEn:"Today",shortAr:"اليوم",icon:Home,accent:"#338C70",soft:"#E5F4E9"},
 {id:"money",to:"/money" as const,en:"Money",ar:"المال",shortEn:"Money",shortAr:"المال",icon:Wallet,accent:"#2D917C",soft:"#E9F7F2"},
 {id:"family",to:"/family" as const,en:"Family",ar:"العيلة",shortEn:"Family",shortAr:"العيلة",icon:HeartHandshake,accent:"#CB6393",soft:"#FCECF2"}
] as const;
export type FamilyArea=(typeof familyDestinations)[number]["id"];
export function areaFromRoute(path:string):FamilyArea{
 if(path==="/"||path==="")return "today";
 if(path.startsWith("/money")||path.startsWith("/household"))return "money";
 if(path.startsWith("/advisor"))return "today";
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
