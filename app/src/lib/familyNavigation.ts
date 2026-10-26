import {Home,HeartHandshake,Wallet,Store,MessageCircleHeart} from "lucide-react";

/** Five distinct top-level destinations; Ask remains a persistent capability.
 * Each chapter owns its own route and active navigation state. */
export const familyDestinations=[
 {id:"today",to:"/" as const,en:"Today",ar:"اليوم",shortEn:"Today",shortAr:"اليوم",icon:Home,accent:"#338C70",soft:"#E5F4E9"},
 {id:"money",to:"/money" as const,en:"Money",ar:"المال",shortEn:"Money",shortAr:"المال",icon:Wallet,accent:"#2D917C",soft:"#E9F7F2"},
 {id:"parents",to:"/what-parents-say" as const,en:"What Parents Say",ar:"شو بيقولوا الأهل؟",shortEn:"Parents Say",shortAr:"تجارب الأهل",icon:MessageCircleHeart,accent:"#AD6588",soft:"#FFF0F6"},
 {id:"finds",to:"/finds" as const,en:"Our Market",ar:"سوقنا",shortEn:"Market",shortAr:"سوقنا",icon:Store,accent:"#C37664",soft:"#FFF3E8"},
 {id:"family",to:"/family" as const,en:"Family",ar:"العيلة",shortEn:"Family",shortAr:"العيلة",icon:HeartHandshake,accent:"#CB6393",soft:"#FCECF2"}
] as const;
export type FamilyArea=(typeof familyDestinations)[number]["id"];
export function areaFromRoute(path:string):FamilyArea{
 if(path==="/"||path==="")return "today";
 if(path.startsWith("/money")||path.startsWith("/household"))return "money";
 if(path.startsWith("/finds"))return "finds";
 if(path.startsWith("/what-parents-say"))return "parents";
 if(path.startsWith("/advisor"))return "today";
 if(path.startsWith("/family")||path.startsWith("/plans")||
  path.startsWith("/calendar")||path.startsWith("/occasions")||
  path.startsWith("/space"))return "family";
 return "today";
}
export function currentRoutePath(){
 if(typeof window==="undefined")return "/";
 const hash=window.location.hash.replace(/^#/,"").split("?")[0]??"/";
 return hash.startsWith("/")?hash:"/";
}
