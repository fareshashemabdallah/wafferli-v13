import {Link} from "@tanstack/react-router";
import {ArrowRight,CheckCircle2,HeartHandshake,ShieldCheck} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {sampleMembers,sampleMoney,type Member,type MoneyState} from "@/lib/money";
import {familySetupState,FAMILY_SETUP_PREFERENCES_KEY,FAMILY_SETUP_PROFILE_SKIP_KEY,FAMILY_SETUP_MONEY_SKIP_KEY} from "@/lib/familySetup";
import {useLocalState} from "@/lib/storage";

/** Existing family, finance and preference editors remain the only source of truth.
 * This checklist links to them; it never overwrites a parent's previous entries. */
export function FamilySetupCard(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [preferencesConfirmed,,preferencesReady]=useLocalState(FAMILY_SETUP_PREFERENCES_KEY,false);
 const [profileSkipped,setProfileSkipped,skipReady]=useLocalState(FAMILY_SETUP_PROFILE_SKIP_KEY,false);
 const [moneySkipped,setMoneySkipped,moneySkipReady]=useLocalState(FAMILY_SETUP_MONEY_SKIP_KEY,false);
 if(!membersReady||!moneyReady||!preferencesReady||!skipReady||!moneySkipReady)return null;
 const setup=familySetupState(members,money,preferencesConfirmed,profileSkipped,moneySkipped);
 if(setup.next===null)return null;
 const items=[
  {id:"family",en:"Tell us who you're planning for",ar:"مين الأشخاص اللي عم نخطط لإلن؟",link:"/space" as const,
   detailEn:"Add people if you wish. Child details are optional.",detailAr:"أضف أفراد العائلة إذا بتحب. معلومات الأطفال اختيارية."},
  {id:"money",en:"Build your monthly money picture",ar:"رتّب صورة ميزانيتك الشهرية",link:"/money" as const,
   detailEn:"Start with income and essential expenses. Savings can wait.",detailAr:"ابدأ بالدخل والمصاريف الأساسية. الادخار ممكن ينتظر."},
  {id:"preferences",en:"Choose how Dabberna helps",ar:"اختَر شو نصائح دبّرنا بتفيدك",link:"/space" as const,
   detailEn:"Confirm advice, outings and privacy preferences.",detailAr:"أكّد تفضيلات النصائح والطلعات والخصوصية."}
 ];
 const current=items.find(item=>item.id===setup.next)!;
 return <section className="mt-5 rounded-2xl border border-[#D7E4D6] bg-[#F2F7EE] p-4 sm:p-5" aria-label={ar?"تحضير مساحة العائلة":"Set up your family space"}>
  <div className="flex items-start gap-3">
   <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand"><HeartHandshake className="size-5"/></span>
   <div className="min-w-0 flex-1">
    <p className="text-[11px] font-semibold tracking-wider text-brand">{ar?"مساحتك العائلية":"MAKE IT YOURS"} · {setup.completed}/{setup.total}</p>
    <h2 className="mt-1 text-lg font-semibold">{ar?"خطوات بسيطة لتصير النصائح مناسبة إلك":"A little setup makes advice more useful"}</h2>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?
     "كل خطوة بإيدك، وما منغيّر أي أرقام أو بيانات بدون موافقتك. معلوماتك المالية بتضل بهذا المتصفح.":
     "You can explore Dabberna without entering income or setting up profiles. Money comparisons need figures only when you request them. Finances stay in this browser."}</p>
   </div>
  </div>
  <div className="mt-4 grid grid-cols-3 gap-1.5" aria-label={ar?"تقدّم الإعداد":"Setup progress"}>
    {setup.steps.map(s=><span key={s.id} className={"h-1.5 rounded-full "+(s.complete?"bg-[#54816B]":"bg-[#CFDCCF]")} />)}
  </div>
  <div className="mt-3 flex items-start justify-between gap-3 rounded-xl bg-white p-3">
   <div>
    <h3 className="text-sm font-semibold">{ar?current.ar:current.en}</h3>
    <p className="mt-1 text-xs text-muted-foreground">{ar?current.detailAr:current.detailEn}</p>
   </div>
   <Link to={current.link} hash={setup.next==="preferences"?"family-preferences":setup.next==="family"?"household-members":""} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full bg-brand px-3 text-xs font-semibold text-white">
    {ar?"تابع":"Continue"} <ArrowRight className="size-3.5 rtl:rotate-180"/>
   </Link>
  </div>
  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
   <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5"/>{ar?"ما في ربط حسابات أو مشاركة تلقائية":"No automatic account linking or sharing"}</span>
   {setup.next==="money"&&!moneySkipped&&<button type="button" className="min-h-9 font-semibold text-brand underline" onClick={()=>setMoneySkipped(true)}>{ar?"ليس الآن: لا أريد إدخال أرقام مالية":"Not now: skip financial estimates"}</button>}
   {setup.next==="family"&&!profileSkipped&&<button type="button" className="min-h-9 font-semibold text-brand underline underline-offset-2"
    onClick={()=>setProfileSkipped(true)}>{ar?"كمّل بدون أسماء أفراد العائلة":"Skip family names for now"}</button>}
  </div>
  {setup.completed>0&&<p className="mt-2 flex items-center gap-1.5 text-xs text-brand"><CheckCircle2 className="size-3.5"/>{ar?"تم حفظ خطواتك المكتملة":"Your completed steps are saved on this device"}</p>}
 </section>;
}
