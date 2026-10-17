import {CalendarDays,CalendarCheck2,Home,ShoppingBasket,Sparkles,Wallet} from "lucide-react";

export const familyDestinations=[
 {id:"today",to:"/" as const,en:"Today",ar:"اليوم",shortEn:"Today",shortAr:"اليوم",icon:Home,accent:"#E58C65",soft:"#FFF0E6"},
 {id:"ask",to:"/advisor" as const,en:"Ask Dabberna",ar:"اسأل دبّرنا",shortEn:"Ask",shortAr:"اسأل",icon:Sparkles,accent:"#9372CB",soft:"#F4EEFF"},
 {id:"plans",to:"/plans" as const,en:"Our Plans",ar:"خططنا",shortEn:"Plans",shortAr:"خططنا",icon:CalendarCheck2,accent:"#7866C3",soft:"#F0EDFF"},
 {id:"money",to:"/money" as const,en:"Money & Bills",ar:"المال والفواتير",shortEn:"Money",shortAr:"المال",icon:Wallet,accent:"#2D917C",soft:"#E9F7F2"},
 {id:"shopping",to:"/explore/smartbuy" as const,en:"Shopping & Wishlist",ar:"المشتريات والرغبات",shortEn:"Shopping",shortAr:"تسوّق",icon:ShoppingBasket,accent:"#E73F81",soft:"#FFE8F0"},
 {id:"calendar",to:"/calendar" as const,en:"Family Calendar",ar:"تقويم العائلة",shortEn:"Calendar",shortAr:"التقويم",icon:CalendarDays,accent:"#4388C1",soft:"#EAF4FE"}
] as const;
export type FamilyArea=(typeof familyDestinations)[number]["id"];
export function areaFromRoute(path:string):FamilyArea {
 if(path==="/"||path==="")return "today";
 if(path.startsWith("/advisor"))return "ask";
 if(path.startsWith("/plans")||path.startsWith("/explore/together")||path.startsWith("/together/"))return "plans";
 if(path.startsWith("/money")||path.startsWith("/household"))return "money";
 if(path.startsWith("/calendar")||path.startsWith("/occasions"))return "calendar";
 if(path.startsWith("/explore")||path.startsWith("/community")||path.startsWith("/experience"))return "shopping";
 if(path.startsWith("/space"))return "today";
 return "today";
}
export function currentRoutePath(){
 if(typeof window==="undefined")return "/";
 const hash=window.location.hash.replace(/^#/,"").split("?")[0]??"/";
 return hash.startsWith("/")?hash:"/";
}
export const familyFollowUps:Record<FamilyArea,readonly FamilyArea[]>={
 today:["ask","plans","calendar"],
 ask:["plans","money","shopping"],
 plans:["money","calendar","shopping"],
 money:["plans","shopping","ask"],
 shopping:["money","plans","calendar"],
 calendar:["plans","shopping","today"]
};
export function destination(area:FamilyArea){return familyDestinations.find(item=>item.id===area)!;}
