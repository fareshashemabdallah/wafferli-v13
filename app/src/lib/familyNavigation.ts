import {Home,HeartHandshake,Wallet,Compass,ShoppingBag} from "lucide-react";

/** One visible destination per family category; Ask remains contextual.
 * Legacy deep links continue to work but map back to their canonical category. */
export const familyDestinations=[
 {id:"today",to:"/" as const,en:"Today",ar:"اليوم",shortEn:"Today",shortAr:"اليوم",icon:Home,accent:"#338C70",soft:"#E5F4E9"},
 {id:"money",to:"/money" as const,en:"Money",ar:"المال",shortEn:"Money",shortAr:"المال",icon:Wallet,accent:"#2D917C",soft:"#E9F7F2"},
 {id:"family",to:"/family" as const,en:"Family",ar:"العيلة",shortEn:"Family",shortAr:"العيلة",icon:HeartHandshake,accent:"#CB6393",soft:"#FCECF2"},
 {id:"discover",to:"/explore" as const,en:"Discover",ar:"اكتشف",shortEn:"Explore",shortAr:"اكتشف",icon:Compass,accent:"#C47F4E",soft:"#FFF1E5"},
 {id:"shopping",to:"/explore/smartbuy" as const,en:"Shopping",ar:"التسوّق",shortEn:"Shop",shortAr:"تسوّق",icon:ShoppingBag,accent:"#657BA7",soft:"#EEF3FA"}
] as const;
export type FamilyArea=(typeof familyDestinations)[number]["id"];
export function areaFromRoute(path:string):FamilyArea{
 if(path==="/"||path==="")return "today";
 if(path.startsWith("/money")||path.startsWith("/household"))return "money";
 if(path.startsWith("/family")||path.startsWith("/plans")||
  path.startsWith("/calendar")||path.startsWith("/occasions")||
  path.startsWith("/space")||path.startsWith("/explore/together")||
  path.startsWith("/together/")||path.startsWith("/vote/"))return "family";
 if(path.startsWith("/explore/smartbuy")||path.startsWith("/explore/shopping")||path.startsWith("/explore/market"))return "shopping";
 if(path.startsWith("/explore")||path.startsWith("/community")||path.startsWith("/experience"))return "discover";
 return "today";
}
export function currentRoutePath(){
 if(typeof window==="undefined")return "/";
 const hash=window.location.hash.replace(/^#/,"").split("?")[0]??"/";
 return hash.startsWith("/")?hash:"/";
}
