import {Link} from "@tanstack/react-router";
import {ArrowRight,Baby,HeartHandshake,MessageCircleHeart,ShieldCheck,UtensilsCrossed,Waves} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {WorldScene} from "./AdventureArtwork";

/**
 * One discovery invitation on Today, not another next-best-action or
 * parallel feature hub. Navigates to the same standalone review route as Family.
 * No reads/writes of family finances, reviews or personal details.
 */
export function WhatParentsSayTodayCard(){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 return <section data-testid="today-parents-say" aria-label={t("Discover What Parents Say","اكتشف شو بيقولوا الأهل")}
  className="relative isolate overflow-hidden rounded-[1.65rem] border border-[#E5DDE5] bg-[linear-gradient(115deg,#FFF8F5_0%,#FFF1F4_52%,#EDF7F0_100%)] shadow-[0_15px_35px_-30px_rgba(132,66,105,.4)]">
  <div className="grid items-center gap-3 p-4 sm:p-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] md:gap-6">
   <div className="relative z-10 min-w-0">
    <p className="flex items-center gap-2 text-[11px] font-extrabold tracking-wide text-[#AD678B]">
     <MessageCircleHeart className="size-4" aria-hidden="true"/>
     {t("PARENTS HELPING PARENTS","أهل بيساعدوا أهل")}
    </p>
    <h2 className="mt-2 text-xl font-black leading-tight text-[#4D3950] sm:text-2xl">
     {t("What Parents Say","شو بيقولوا الأهل؟")}
    </h2>
    <p className="mt-2 text-base font-bold text-[#5D5360]">
     {t("Thinking of trying somewhere new?","عم تفكّر تجرّب مكان جديد؟")}
    </p>
    <p className="mt-2 max-w-[520px] text-sm leading-relaxed text-[#726777]">
     {t("Explore clubs, activities, restaurants and children's products through the questions parents care about—safety, age fit and convenience.",
      "اكتشف النوادي والأنشطة والمطاعم ومنتجات الأطفال حسب الأسئلة اللي بتهم الأهل: السلامة، ملاءمة العمر والراحة.")}
    </p>
    <Link to="/what-parents-say"
     className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#A9537D] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#91416B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4471]">
     {t("Explore What Parents Say","اكتشف تجارب الأهل")}
     <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true"/>
    </Link>
    <p className="mt-2 text-[11px] leading-relaxed text-[#8B7783]">
     {t("Private pilot: community reviews and live online summaries are not connected yet.",
      "تجربة خاصة: مراجعات الأهل العامة وملخصات الإنترنت المباشرة مش متاحة بعد.")}
    </p>
   </div>
   <div className="relative min-w-0" aria-hidden="true">
    <div className="overflow-hidden rounded-[1.3rem] border-4 border-white/90 bg-[#E2F2E7] shadow-[0_10px_25px_-20px_rgba(40,75,55,.5)]">
     <WorldScene place="park" className="block h-auto w-full"/>
    </div>
    <div className="mt-2 grid grid-cols-3 gap-1.5">
     <span className="flex min-h-10 items-center justify-center gap-1 rounded-xl bg-white/85 px-1.5 text-[10px] font-bold text-[#538269]"><ShieldCheck className="size-3.5"/>{t("Safety","السلامة")}</span>
     <span className="flex min-h-10 items-center justify-center gap-1 rounded-xl bg-white/85 px-1.5 text-[10px] font-bold text-[#9C6882]"><Baby className="size-3.5"/>{t("Age fit","العمر")}</span>
     <span className="flex min-h-10 items-center justify-center gap-1 rounded-xl bg-white/85 px-1.5 text-[10px] font-bold text-[#967553]"><HeartHandshake className="size-3.5"/>{t("Convenience","الراحة")}</span>
    </div>
   </div>
  </div>
 </section>;
}
