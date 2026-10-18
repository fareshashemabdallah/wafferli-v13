import {Link} from "@tanstack/react-router";
import {ArrowRight,MapPinned,Sparkles} from "lucide-react";
import type {AdventurePlace} from "./AdventureArtwork";
import {RobotBuddy,WorldScene} from "./AdventureArtwork";
import {useI18n} from "@/lib/i18n";

type Chapter={
 place:AdventurePlace;eyebrowEn:string;eyebrowAr:string;introEn:string;introAr:string;
 fallbackEn:string;fallbackAr:string;next?:{to:"/money"|"/plans"|"/calendar"|"/explore/smartbuy"|"/explore/weekend"|"/explore/shopping"|"/advisor"|"/family"|"/space";en:string;ar:string};
};
/** The same world-and-robot design across ALL native pages. Context is
 * descriptive only: never fabricates financial progress, merchant prices
 * or AI capabilities. Routes, data and payments remain untouched. */
export function adventureChapter(path:string):Chapter{
 if(path==="/advisor")return {place:"home",eyebrowEn:"THE GUIDE",eyebrowAr:"الدليل",
  introEn:"Ask a question. Discover one useful next step.",introAr:"اسأل سؤالاً، واكتشف الخطوة المناسبة.",
  fallbackEn:"Ask Dabberna",fallbackAr:"اسأل دبّرنا",next:{to:"/money",en:"Explore your money",ar:"اكتشف مال العيلة"}};
 if(path==="/family")return {place:"park",eyebrowEn:"FAMILY ADVENTURES",eyebrowAr:"مغامرات العيلة",
  introEn:"Choose a path: moments, plans or family responsibilities.",introAr:"اختَر طريقك: مناسبات وخطط ومسؤوليات العيلة.",
  fallbackEn:"Family Life",fallbackAr:"حياة العيلة",next:{to:"/explore/weekend",en:"Find an outing",ar:"اكتشف طلعة"}};
 if(path==="/calendar")return {place:"moments",eyebrowEn:"FAMILY MOMENTS",eyebrowAr:"لحظات العيلة",
  introEn:"Discover your next special date and prepare together.",introAr:"اكتشف المناسبة الجاية وجهّزولها سوا.",
  fallbackEn:"Family Calendar",fallbackAr:"تقويم العيلة",next:{to:"/plans",en:"Our plans",ar:"خططنا"}};
 if(path==="/plans")return {place:"moments",eyebrowEn:"MAKE A PLAN",eyebrowAr:"خطط لمغامرتك",
  introEn:"Pick one idea, plan what matters and follow it through.",introAr:"اختَر فكرة، خطّط للمهم، وكمّل خطوة خطوة.",
  fallbackEn:"Our Plans",fallbackAr:"خططنا",next:{to:"/calendar",en:"Upcoming moments",ar:"المناسبات الجاية"}};
 if(path==="/occasions")return {place:"moments",eyebrowEn:"CELEBRATE TOGETHER",eyebrowAr:"نحتفل سوا",
  introEn:"Turn a special date into a thoughtful celebration.",introAr:"حوّل المناسبة الحلوة إلى احتفال مدروس.",
  fallbackEn:"Special Occasions",fallbackAr:"مناسباتنا",next:{to:"/calendar",en:"Family calendar",ar:"تقويم العيلة"}};
 if(path==="/space")return {place:"home",eyebrowEn:"YOUR FAMILY HOME",eyebrowAr:"بيت العيلة",
  introEn:"Get to know your family world, one detail at a time.",introAr:"عرّفنا على عيلتك خطوة خطوة، بلا استمارات طويلة.",
  fallbackEn:"My Family",fallbackAr:"عيلتي",next:{to:"/family",en:"Family adventures",ar:"مغامرات العيلة"}};
 if(path==="/household")return {place:"home",eyebrowEn:"FAMILY PRIVACY",eyebrowAr:"خصوصية العيلة",
  introEn:"Manage who belongs to your private household safely.",introAr:"حدّد أفراد البيت وخصوصيتهم بأمان.",
  fallbackEn:"Household accounts",fallbackAr:"حسابات العيلة",next:{to:"/space",en:"Family settings",ar:"إعدادات العيلة"}};
 if(path.startsWith("/explore/weekend")||path.startsWith("/explore/together")||path.startsWith("/explore/restaurants"))
 return {place:"park",eyebrowEn:"OUTING ADVENTURE",eyebrowAr:"مغامرة الطلعة",
  introEn:"Find a family-friendly option and check what it really costs.",introAr:"اكتشف طلعة مناسبة للعيلة وافهم تكلفتها.",
  fallbackEn:"Outings & Places",fallbackAr:"الطلعات والأماكن",next:{to:"/plans",en:"Plan an outing",ar:"خطّط لطلعة"}};
 if(path.startsWith("/explore")||path.startsWith("/shopping"))
 return {place:"market",eyebrowEn:"THE FAMILY MARKET",eyebrowAr:"سوق العيلة",
  introEn:"Explore what you need, compare choices, and shop wisely.",introAr:"اكتشف حاجات البيت، قارن الخيارات، وتسوّق بذكاء.",
  fallbackEn:"Smart Shopping",fallbackAr:"تسوّق بذكاء",next:{to:"/explore/shopping",en:"Our basket",ar:"سلّتنا"}};
 if(path==="/community"||path==="/experience")
 return {place:"park",eyebrowEn:"FAMILY & FRIENDS",eyebrowAr:"العيلة والأصحاب",
  introEn:"Share ideas and experiences at your own pace.",introAr:"شاركوا الأفكار والتجارب على راحتكم.",
  fallbackEn:"Family & Friends",fallbackAr:"العيلة والأصحاب",next:{to:"/family",en:"Family adventures",ar:"حياة العيلة"}};
 if(path==="/about")return {place:"home",eyebrowEn:"YOUR WORLD, YOUR RULES",eyebrowAr:"عالمك، قرارك",
  introEn:"Explore how Dabberna works and keeps your choices private.",introAr:"اكتشف كيف دبّرنا بيساعدك وبيحترم خصوصيتك.",
  fallbackEn:"About Dabberna",fallbackAr:"عن دبّرنا",next:{to:"/space",en:"Family settings",ar:"إعدادات العيلة"}};
 return {place:"home",eyebrowEn:"OUR MONEY",eyebrowAr:"مال العيلة",
  introEn:"Explore your finances at your own pace.",introAr:"اكتشف مالية بيتك على راحتك.",
  fallbackEn:"Our Money",fallbackAr:"مال العيلة",next:{to:"/advisor",en:"Ask Dabberna",ar:"اسأل دبّرنا"}};
}

export function AdventurePageHeader({path,title}:{path:string;title?:string}){
 const {lang}=useI18n(),ar=lang==="ar",chapter=adventureChapter(path);
 const t=(en:string,a:string)=>ar?a:en;
 return <header className="dabberna-adventure-stage mb-4 overflow-hidden rounded-[1.65rem] border border-[#C9E6D6] shadow-[0_18px_38px_-32px_rgba(22,87,64,.52)]" aria-label={t("Adventure location","الموقع في المغامرة")}>
  <div className="relative isolate min-h-[158px] bg-gradient-to-r from-[#E2F5E8] via-[#DDF2E9] to-[#D4EDEC] sm:min-h-[175px]">
   <WorldScene place={chapter.place} className="pointer-events-none absolute inset-y-0 end-0 h-full w-[53%] object-cover opacity-80" />
   <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#E5F6EA] via-[#E5F6EA]/95 to-[#E5F6EA]/5 rtl:bg-gradient-to-l"/>
   {path==="/advisor"&&<RobotBuddy className="pointer-events-none absolute bottom-0 end-3 z-10 h-[88px] w-[80px] sm:h-28 sm:w-28"/>}
   <div className="relative z-10 flex min-h-[158px] w-[72%] flex-col justify-center px-4 py-4 sm:min-h-[175px] sm:w-[64%] sm:px-6">
    <Link to="/" className="mb-2 inline-flex w-fit min-h-9 items-center gap-1 rounded-full border border-[#B8DECB] bg-white/90 px-3 text-[11px] font-extrabold text-[#287A5F] hover:bg-white">
     <MapPinned className="size-3.5"/>{t("My world","عالمي")} <span aria-hidden="true">›</span> {ar?chapter.eyebrowAr:chapter.eyebrowEn}
    </Link>
    <h1 className="text-xl font-black leading-tight tracking-tight text-[#174938] sm:text-[1.7rem]">{title??t(chapter.fallbackEn,chapter.fallbackAr)}</h1>
    <p className="mt-1 max-w-[380px] text-xs leading-snug text-[#4C6D60] sm:text-sm">{t(chapter.introEn,chapter.introAr)}</p>
   </div>
  </div>
  {chapter.next&&<div className="flex min-h-10 items-center justify-between gap-2 border-t border-[#CBE6D7] bg-[#F6FBF4] px-4 py-1.5 sm:px-6">
   <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5D7B6C]"><Sparkles className="size-4"/>{t("Another path","طريق جديد")}</span>
   <Link to={chapter.next.to} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 text-xs font-bold text-[#277458] hover:bg-[#E8F4E9]">
    {t(chapter.next.en,chapter.next.ar)}<ArrowRight className="size-3.5 rtl:rotate-180"/>
   </Link>
  </div>}
 </header>;
}
