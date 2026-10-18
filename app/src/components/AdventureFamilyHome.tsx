import {Link} from "@tanstack/react-router";
import {ArrowRight,Compass,Heart,MessageCircle,ShieldCheck,Sparkles} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState,fmtJOD} from "@/lib/storage";
import {sampleMoney,sampleMembers,computeMoney,type MoneyState,type Member} from "@/lib/money";
import {realFamilyMembers} from "@/lib/familySetup";
import {FAMILY_PLANS_KEY,type FamilyPlan} from "@/lib/familyPlans";
import {type FamilyMoment} from "@/lib/familyCalendar";
import {FAMILY_TASKS_KEY,type FamilyTask} from "@/lib/familyTasks";
import {type BasketEntry} from "@/lib/basketRecording";
import {FAMILY_WISHLIST_KEY,type WishlistItem} from "@/lib/familyWishlist";
import {homeSnapshot} from "@/lib/homeSnapshot";
import {RobotBuddy,WorldScene,type AdventurePlace} from "./AdventureArtwork";
import {TodayFamilyBrief} from "./TodayFamilyBrief";

const destinations=[
 {id:"home",en:"Our Money",ar:"مال العيلة",summaryEn:"Understand & plan our family costs",summaryAr:"نفهم مصاريف البيت ونخطط لها",to:"/money",accent:"#E5F5E8"},
 {id:"market",en:"Smart Shopping",ar:"تسوّق بذكاء",summaryEn:"Explore purchases and better choices",summaryAr:"نقارن الخيارات والمشتريات",to:"/explore/smartbuy",accent:"#FFF1E1"},
 {id:"park",en:"Adventure Park",ar:"حديقة المغامرات",summaryEn:"Family outings & children's activities",summaryAr:"طلعات وأنشطة للأطفال",to:"/explore/weekend",accent:"#E5F4F2"},
 {id:"moments",en:"Family Moments",ar:"لحظات العيلة",summaryEn:"Birthdays, gifts and celebrations",summaryAr:"مناسبات وهدايا وأيام حلوة",to:"/calendar",accent:"#FFEDF0"}
] as const;

/** An illustrated navigation world backed by actual existing feature routes.
 * Artwork is decorative, while optional summaries use ONLY saved data. */
export function AdventureFamilyHome(){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [moments,,momentsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [tasks,,tasksReady]=useLocalState<FamilyTask[]>(FAMILY_TASKS_KEY,[]);
 const [basket,,basketReady]=useLocalState<BasketEntry[]>("shopping",[]);
 const [wishlist,,wishlistReady]=useLocalState<WishlistItem[]>(FAMILY_WISHLIST_KEY,[]);
 const ready=moneyReady&&membersReady&&momentsReady&&plansReady&&tasksReady&&basketReady&&wishlistReady;
 const snapshot=homeSnapshot({money,members,moments,plans,tasks,basket,wishlist,arabic:ar});
 const next=snapshot.agenda[0];
 const realMembers=realFamilyMembers(members);
 const month=!money.demo?computeMoney(money):null;
 const enteredCount=money.demo?0:money.categories.length;
 return <main className="mx-auto max-w-[1090px] space-y-4 pb-6 text-[#153A37]" data-adventure-home>
  <header className="flex items-center justify-between gap-3 px-1">
   <div>
    <p className="text-xs font-extrabold tracking-[.13em] text-[#458778]">{t("WELCOME TO YOUR FAMILY WORLD","أهلاً بعالم عيلتك")}</p>
    <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Dabberna <span className="text-[#448979]">✦</span></h1>
    <p className="mt-1 text-sm text-[#5F746D]">{t("Your family adventure starts here","مغامرة عيلتك بتبدأ هون")}</p>
   </div>
   <Link to="/space" aria-label={t("Your family","عيلتك")}
    className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[#C5E3D8] bg-[#F2FCF4] text-2xl shadow-sm">🏡</Link>
  </header>

  <section className="relative isolate min-h-[260px] overflow-hidden rounded-[2rem] border border-[#CFE8DD] bg-[linear-gradient(165deg,#B8E6F5_0%,#E1F5F4_40%,#FFF2D8_77%,#F4E4C9_100%)] shadow-[0_22px_48px_-37px_rgba(22,76,67,.55)] sm:min-h-[320px]" aria-label={t("Welcome to your family adventure","أهلاً بمغامرة العيلة")}>
   <WorldScene place="home" className="absolute inset-x-0 bottom-0 h-[87%] w-full opacity-90" />
   <div className="pointer-events-none absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#F1E7D2] to-transparent"/>
   <img src={import.meta.env.BASE_URL+"landing-family-characters.avif"}
    alt={t("Cartoon family with two parents and children","عيلة كرتونية فيها أم وأب وأطفال")}
    loading="eager" className="absolute bottom-0 start-[-5%] z-10 h-[80%] w-[70%] object-contain object-bottom drop-shadow-[0_7px_8px_rgba(50,65,39,.15)] sm:start-[0%] sm:h-[93%] sm:w-[53%]"/>
   <div className="absolute end-3 top-4 z-20 max-w-[53%] rounded-[1.4rem] border border-white/90 bg-white/95 px-4 py-3 shadow-lg sm:end-9 sm:top-9 sm:max-w-[42%]">
    <p className="text-sm font-extrabold leading-snug sm:text-lg">{t("Hello! What shall we explore today?","مرحبا! شو بدنا نكتشف اليوم؟")}</p>
    <p className="mt-1 text-xs leading-relaxed text-[#56726A]">{t("Discover, plan and enjoy life together.","نكتشف ونخطط ونستمتع سوا.")}</p>
   </div>
   <RobotBuddy className="absolute bottom-2 end-3 z-20 h-[85px] w-[80px] drop-shadow-xl sm:bottom-0 sm:end-7 sm:h-[139px] sm:w-[132px]"/>
  </section>

  <section aria-label={t("Explore the family world","اكتشف عالم العيلة")}>
   <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold"><Compass className="size-5 text-[#368C73]"/>{t("Choose an adventure","اختَر مغامرتك")}</h2>
   <div className="grid grid-cols-2 gap-3 sm:gap-4">
    {destinations.map(p=><Link to={p.to} key={p.id} aria-label={ar?p.ar:p.en}
     className="group overflow-hidden rounded-[1.45rem] border border-[#DEE8D9] bg-white p-2 shadow-[0_12px_28px_-23px_rgba(26,69,57,.35)] transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-4 focus-visible:outline-[#57A78E] active:scale-[.985] sm:p-3">
      <div style={{backgroundColor:p.accent}} className="overflow-hidden rounded-[1.1rem]">
       <WorldScene place={p.id as AdventurePlace} className="aspect-[1.6] w-full"/>
      </div>
      <div className="flex min-h-[100px] items-start justify-between gap-2 px-1 pb-1 pt-3 sm:min-h-[91px]">
       <div className="min-w-0"><h3 className="text-base font-black leading-tight sm:text-lg">{ar?p.ar:p.en}</h3>
        <p className="mt-1 text-xs leading-snug text-[#63756E]">{ar?p.summaryAr:p.summaryEn}</p>
       </div>
       <ArrowRight className="mt-1 size-4 shrink-0 text-[#337D64] rtl:rotate-180"/>
      </div>
    </Link>)}
   </div>
  </section>

  <section className="rounded-[1.4rem] border border-[#C6E7D9] bg-gradient-to-r from-[#C9EFE8] via-[#E3F8EB] to-[#E9F5DC] p-3.5 sm:p-4">
   <Link to="/advisor" className="flex min-h-12 items-center gap-3" aria-label={t("Ask Dabberna","اسأل دبرنا")}>
    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/80 text-[#318A70]"><MessageCircle className="size-6"/></span>
    <span className="min-w-0 flex-1"><strong className="block text-sm">{t("Ask Dabberna","اسأل دبرنا")}</strong>
     <span className="mt-0.5 block text-xs text-[#4A7164]">{t("Need help with a family choice?","بدك مساعدة بقرار للعيلة؟")}</span>
    </span>
    <ArrowRight className="size-5 text-[#27846E] rtl:rotate-180"/>
   </Link>
  </section>

  {ready&&<details className="rounded-2xl border border-[#DAE7DE] bg-white p-4">
   <summary className="min-h-10 cursor-pointer text-sm font-bold text-[#286E59]">{t("A little update from your family world (optional)","آخر أخبار عالم عيلتك (اختياري)")}</summary>
   <div className="mt-3 space-y-3 border-t border-[#E5EEE7] pt-3">
    <p className="text-sm leading-relaxed text-[#516C60]">{realMembers.length?
     t(`${realMembers.length} family members are saved in your profile.`,`أضفت ${realMembers.length} أفراد من العيلة.`):
     t("Add your family when you feel ready.","أضف أفراد عيلتك وقت تكون جاهز.")}</p>
    <p className="text-sm leading-relaxed text-[#516C60]">{month?
     t(`You have ${enteredCount} spending categories and ${fmtJOD(month.spent)} in paid entries this month. These are recorded amounts, not bank balances.`,
       `عندك ${enteredCount} فئات مصاريف و${fmtJOD(month.spent)} مدفوع ومسجّل هالشهر، مش رصيد بنك.`):
     t("No real household finances added yet; example amounts are hidden.","ما دخلت مالية العيلة الفعلية بعد؛ ما رح نعرض أرقام تجريبية.")}</p>
    {next&&<p className="text-sm leading-relaxed text-[#516C60]"><Heart className="me-1 inline size-4 text-[#DB8B79]"/>{next.title} · {next.date}</p>}
    <TodayFamilyBrief compact/>
   </div>
  </details>}
  <p className="flex items-start gap-2 px-1 text-[11px] leading-relaxed text-[#70837B]"><ShieldCheck className="mt-0.5 size-4 shrink-0"/>{t("Your private family details stay on this device during the pilot. Exploring is not a financial score.","بيانات العيلة محفوظة على الجهاز خلال التجربة. استكشاف المغامرات مش تقييم مالي.")}</p>
 </main>;
}
