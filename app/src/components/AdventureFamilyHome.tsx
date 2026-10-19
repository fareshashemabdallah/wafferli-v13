import {Link} from "@tanstack/react-router";
import {ArrowRight,Compass,ShieldCheck} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {RobotBuddy,WorldScene} from "./AdventureArtwork";
import {FamilyMoneyJourneyCard} from "./FamilyMoneyJourneyCard";
import "./adventureFamilyHero.css";

/** The ONE family story at the centre of the app.
 * Detailed money and planning are owned by their workspaces, not repeated here.
 * The old optional summary, a second 'next step', activity catalogue and
 * four extra navigation panels were intentionally removed from Home.
 */
export function AdventureFamilyHome(){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const ideas=[
  {to:"/explore/weekend" as const,icon:"🌳",en:"Find something to enjoy",ar:"دور على نشاط تستمتعوا فيه",
   descriptionEn:"Real mapped places and family activity ideas",descriptionAr:"أماكن على الخريطة وأفكار تناسب العيلة"},
  {to:"/explore/smartbuy" as const,icon:"🛍️",en:"Choose what to buy",ar:"اختار شو لازم تشتري",
   descriptionEn:"Compare options before committing",descriptionAr:"قارن الخيارات قبل ما تلتزم"},
  {to:"/calendar" as const,icon:"🎂",en:"Prepare a family moment",ar:"حضّر مناسبة للعيلة",
   descriptionEn:"Occasions and dates, connected to your plans",descriptionAr:"المناسبات والمواعيد مرتبطة بخطط العيلة"}
 ];
 return <main className="mx-auto max-w-[1040px] space-y-4 pb-6 text-[#153A37]" data-adventure-home>
  <header className="flex items-center justify-between gap-3 px-1">
   <div>
    <p className="text-xs font-extrabold tracking-[.13em] text-[#458778]">{t("ONE FAMILY, ONE RHYTHM","عيلة واحدة، وإيقاع واحد")}</p>
    <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Dabberna <span className="text-[#448979]">✦</span></h1>
    <p className="mt-1 text-sm text-[#5F746D]">{t("Your family money and life, cared for together","مال عيلتك وحياتها، منعتني فيهم سوا")}</p>
   </div>
   <Link to="/space" aria-label={t("Your family","عيلتك")}
    className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[#C5E3D8] bg-[#F2FCF4] text-2xl shadow-sm">🏡</Link>
  </header>

  <section className="adventure-family-hero rounded-[2rem] border border-[#CFE8DD] bg-[linear-gradient(165deg,#B8E6F5_0%,#E1F5F4_40%,#FFF2D8_77%,#F4E4C9_100%)] shadow-[0_22px_48px_-37px_rgba(22,76,67,.55)]" aria-label={t("Welcome to your family adventure","أهلاً بمغامرة العيلة")}>
   <div className="adventure-family-hero__scene" aria-hidden="true">
    <WorldScene place="home" className="adventure-family-hero__world"/>
   </div>
   <div className="adventure-family-hero__greeting" data-testid="adventure-family-greeting">
    <p className="text-sm font-extrabold leading-snug text-[#183F38] sm:text-lg">{t("How can our money care for our family?","كيف في مالنا يساعد عيلتنا؟")}</p>
    <p className="mt-1 text-xs leading-relaxed text-[#4D6B62]">{t("Understand, protect and prepare—so we can live well together.","نفهم ونحمي ونتحضّر، لنعيش منيح سوا.")}</p>
   </div>
   <div className="adventure-family-hero__art" data-testid="adventure-family-portrait-area">
    <img src={import.meta.env.BASE_URL+"landing-family-characters.avif"}
     alt={t("Cartoon family with two parents and children","عيلة كرتونية فيها أم وأب وأطفال")}
     loading="eager" className="adventure-family-hero__family"/>
    <RobotBuddy className="adventure-family-hero__robot"/>
   </div>
  </section>

  <FamilyMoneyJourneyCard/>

  <section className="rounded-[1.4rem] border border-[#DDE9DF] bg-[#F9FCF8] p-4 sm:p-5" aria-label={t("Explore family possibilities","اكتشف فرص لعيلتك")}>
   <div className="mb-3 flex items-start gap-2">
    <Compass className="mt-0.5 size-5 shrink-0 text-[#348269]"/>
    <div>
     <h2 className="text-base font-extrabold">{t("When you're ready, explore possibilities","وقت تكون جاهز، اكتشف الخيارات")}</h2>
     <p className="mt-1 text-xs leading-relaxed text-[#668174]">{t("Family experiences and purchases support the journey; they're not another money dashboard.","الطلعات والمشتريات جزء من الحياة، مش شاشة مالية ثانية.")}</p>
    </div>
   </div>
   <div className="grid gap-2 sm:grid-cols-3">
    {ideas.map(item=><Link key={item.to} to={item.to}
     className="flex min-h-24 items-center gap-3 rounded-xl border border-[#DEEADF] bg-white p-3 transition hover:bg-[#F0F8EE]">
      <span className="text-2xl" aria-hidden="true">{item.icon}</span>
      <span className="min-w-0 flex-1">
       <strong className="block text-sm text-[#244D3D]">{ar?item.ar:item.en}</strong>
       <span className="mt-1 block text-xs leading-snug text-[#718378]">{ar?item.descriptionAr:item.descriptionEn}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-[#44886F] rtl:rotate-180"/>
     </Link>)}
   </div>
  </section>
  <p className="flex items-start gap-2 px-1 text-[11px] leading-relaxed text-[#70837B]"><ShieldCheck className="mt-0.5 size-4 shrink-0"/>
   {t("Your private family financial details remain on this device during the pilot. Plans, dates and costs are recorded in their original workspaces—never duplicated by this home.",
      "تفاصيل مالية العيلة خاصة ومحفوظة على هالجهاز خلال التجربة. الخطط والمواعيد والمصاريف بتبقى بسجلاتها الأصلية، مش نسخ مكررة هون.")}</p>
 </main>;
}
