import {useEffect,useState,type FormEvent} from "react";
import {CheckCircle2,MessageCircle,Plus,Receipt,ShoppingBasket,X} from "lucide-react";
import {Link} from "@tanstack/react-router";
import {useI18n} from "@/lib/i18n";
import {useLocalState,uid,fmtJOD} from "@/lib/storage";
import {computeMoney,sampleMoney,type MoneyState} from "@/lib/money";
import {isSampleBasketEntry,type BasketEntry} from "@/lib/basketRecording";
import {QuickExpenseCard} from "./QuickExpenseCard";

type Action="expense"|"shopping"|null;

/** Fast actions change the existing Money and shopping records, never parallel lists.
 *  Guided advice uses the already-mounted question input on Today.
 */
export function TodayQuickActions({onAsk}:{onAsk:()=>void}){
 const {lang}=useI18n(),ar=lang==="ar";
 const tr=(en:string,arabic:string)=>ar?arabic:en;
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [basket,setBasket,basketReady]=useLocalState<BasketEntry[]>("shopping",[]);
 const [active,setActive]=useState<Action>(null);
 const [need,setNeed]=useState("");
 const [error,setError]=useState("");
 const [pendingId,setPendingId]=useState("");
 const [savedName,setSavedName]=useState("");
 const ready=moneyReady&&basketReady;
 const actualBasket=basket.filter(b=>!isSampleBasketEntry(b)&&b.name.trim());
 const outstanding=actualBasket.filter(b=>!b.done).length;
 const spent=!money.demo&&moneyReady?computeMoney(money).spent:null;
 useEffect(()=>{
  if(pendingId&&basket.some(b=>b.id===pendingId)){
   setPendingId("");
   setSavedName(tr("Saved to your family basket.","تم الحفظ في سلّة العائلة."));
  }
 // lang is included via translated message; value is only announced after persisted state confirms.
 },[basket,pendingId,lang]);
 const addNeed=(e:FormEvent)=>{
  e.preventDefault();if(!ready||pendingId)return;
  const name=need.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,60);
  if(name.length<2||/\(sample\)/i.test(name)){
   setError(tr("Enter a real shopping item (at least 2 characters).","أدخل اسماً حقيقياً لا يقل عن حرفين."));return;
  }
  if(actualBasket.some(b=>!b.done&&b.name.toLocaleLowerCase()===name.toLocaleLowerCase())){
   setError(tr("This item is already on your open shopping list.","هذا العنصر موجود بالفعل في قائمة مشترياتك."));return;
  }
  const id=uid();
  setError("");setSavedName("");setPendingId(id);
  setBasket(old=>[...old,{id,name,qty:1,price:0,done:false}]);
  setNeed("");
 };
 const button=(name:string,icon:React.ReactNode,action:()=>void,chosen:boolean,theme:string)=>
  <button type="button" onClick={action} aria-pressed={chosen}
   className="flex min-h-[85px] flex-col items-center justify-center gap-2 rounded-[1.1rem] border border-[#F1E3E8] bg-white px-2 py-3 text-center text-[12px] font-bold leading-snug text-[#25354B] shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C974A2]"
   style={chosen?{borderColor:theme,backgroundColor:"#FFF8FB"}:{}}>
   <span aria-hidden="true" className="grid size-9 place-items-center rounded-2xl" style={{backgroundColor:theme+"20",color:theme}}>{icon}</span>
   {name}
  </button>;
 return <section aria-label={tr("Quick family actions","خطوات العائلة السريعة")}
  className="rounded-[1.6rem] border border-[#F0E4E9] bg-[#FFFDFD] p-3 shadow-[0_12px_34px_-29px_rgba(59,37,69,.2)] sm:p-4">
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
   <div>
    <h2 className="text-base font-extrabold text-[#25354B]">{tr("What do you need to do?","شو بدك تعمل هلّق؟")}</h2>
    <p className="mt-1 text-xs text-[#748093]">{tr("Three frequent actions. No searching through pages.","ثلاث خطوات سريعة من دون البحث بين الصفحات.")}</p>
   </div>
   {ready&&<span className="text-[11px] text-[#68758A]">
    {spent!==null?tr("Recorded this month: ","المصروف المسجّل هذا الشهر: ")+fmtJOD(spent)+" · ":""}
    {outstanding} {tr("shopping items open","احتياجات مشتريات مفتوحة")}
   </span>}
  </div>
  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
   {button(tr("Add expense","سجّل مصروف"),<Receipt className="size-5"/>,()=>{setActive(x=>x==="expense"?null:"expense");setError("");},active==="expense","#389683")}
   {button(tr("Add shopping item","أضف للمشتريات"),<ShoppingBasket className="size-5"/>,()=>{setActive(x=>x==="shopping"?null:"shopping");setError("");},active==="shopping","#DC679A")}
   {button(tr("Ask Dabberna","اسأل دبّرنا"),<MessageCircle className="size-5"/>,()=>{setActive(null);onAsk();},false,"#8774BE")}
  </div>
  {active==="expense"&&<div className="mt-3" data-testid="fast-expense-panel">
   <QuickExpenseCard onClose={()=>setActive(null)}/>
  </div>}
  {active==="shopping"&&<div className="mt-3 rounded-[1.2rem] border border-[#F0DFE7] bg-[#FFF7FA] p-3 sm:p-4">
   <div className="mb-3 flex items-center justify-between gap-2">
    <h3 className="text-sm font-extrabold">{tr("Add a family need","أضف احتياجاً للعائلة")}</h3>
    <button type="button" aria-label={tr("Close shopping entry","إغلاق إضافة المشتريات")}
     onClick={()=>setActive(null)} className="grid size-11 place-items-center rounded-full bg-white"><X className="size-4"/></button>
   </div>
   <form onSubmit={addNeed} className="flex flex-wrap gap-2">
    <label className="min-w-40 flex-1 text-xs font-semibold">{tr("What do you need?","شو ناقصكم؟")}
     <input required minLength={2} maxLength={60} value={need} onChange={e=>setNeed(e.target.value)}
      placeholder={tr("e.g. milk or school supplies","مثلاً حليب أو مستلزمات المدرسة")}
      className="mt-1 min-h-11 w-full rounded-xl border border-[#EADDE5] bg-white px-3 text-base"/>
    </label>
    <button type="submit" disabled={!ready||!!pendingId}
     className="mt-auto inline-flex min-h-11 items-center gap-1 rounded-xl bg-[#C54E83] px-4 text-sm font-bold text-white disabled:opacity-50">
     <Plus className="size-4"/>{tr("Save item","احفظ العنصر")}
    </button>
   </form>
   {error&&<p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
   {savedName&&<p role="status" className="mt-2 flex items-center gap-2 text-xs font-bold text-[#247A5D]"><CheckCircle2 className="size-4"/>{savedName}</p>}
   <p className="mt-2 text-[11px] text-[#747B8C]">{tr("Added without a price or purchase. Mark it done in your existing basket.",
    "يُضاف بلا سعر أو عملية شراء. يمكنك تأكيد شرائه في سلّتك.")}</p>
   <Link to="/explore/shopping" className="mt-2 inline-flex min-h-10 items-center text-xs font-semibold text-[#A63F71] underline">
    {tr("Open existing shopping list","افتح قائمة المشتريات")}
   </Link>
  </div>}
 </section>;
}
