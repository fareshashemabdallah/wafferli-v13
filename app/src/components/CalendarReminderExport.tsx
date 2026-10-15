import {useMemo,useState} from "react";
import {CalendarClock,Download} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {FAMILY_TASKS_KEY,type FamilyTask} from "@/lib/familyTasks";
import {FAMILY_WISHLIST_KEY,type WishlistItem} from "@/lib/familyWishlist";
import {buildReminderCalendar,collectCalendarReminders} from "@/lib/localCalendarReminders";
import type {MoneyState,Member} from "@/lib/money";
import type {FamilyMoment} from "@/lib/familyCalendar";

export function CalendarReminderExport({money,members,moments}:{
 money:MoneyState;members:readonly Member[];moments:readonly FamilyMoment[]
}){
 const {lang}=useI18n(),ar=lang==="ar";
 const [bills,setBills]=useState(false);
 const [family,setFamily]=useState(false);
 const [tasksEnabled,setTasksEnabled]=useState(false);
 const [shoppingEnabled,setShoppingEnabled]=useState(false);
 const [tasks,,tasksReady]=useLocalState<FamilyTask[]>(FAMILY_TASKS_KEY,[]);
 const [wishlist,,wishlistReady]=useLocalState<WishlistItem[]>(FAMILY_WISHLIST_KEY,[]);
 const [ack,setAck]=useState(false);
 const [error,setError]=useState("");
 const list=useMemo(()=>collectCalendarReminders({
  money,members,moments,tasks,wishlist,options:{bills,family,tasks:tasksEnabled,shopping:shoppingEnabled}
 }),[money,members,moments,tasks,wishlist,bills,family,tasksEnabled,shoppingEnabled]);
 const download=()=>{
  setError("");
  if(!ack||!list.length||!tasksReady||!wishlistReady)return;
  try{
   const ics=buildReminderCalendar(list);
   const url=URL.createObjectURL(new Blob([ics],{type:"text/calendar;charset=utf-8"}));
   const a=document.createElement("a");
   a.href=url;a.download="dabberna-family-reminders-"+new Date().toISOString().slice(0,10)+".ics";
   document.body.appendChild(a);a.click();a.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(e){setError(e instanceof Error?e.message:String(e));}
 };
 return <details className="mt-4 rounded-xl border border-[#DCE6D9] bg-white p-3">
  <summary className="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-semibold text-brand">
   <CalendarClock className="size-4"/>
   {ar?"انسخ المواعيد لتقويم هاتفك":"Export reminders to your own calendar"} +
  </summary>
  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?
   "اختَر المواعيد التي تريدها. سنجهز ملف تقويم على جهازك فقط، مع تذكير قبل اليوم. التطبيق نفسه لا يرسل تنبيهات بالخلفية؛ قد يقوم تقويم هاتفك بإرسالها حسب إعداداته.":
   "Choose which dates to include. This downloads an .ics file with a one-day reminder. Dabberna does not send background alerts; your calendar application decides whether to deliver them."}</p>
  <div className="mt-3 flex flex-wrap gap-3 text-xs">
   <label className="inline-flex min-h-10 items-center gap-2">
    <input type="checkbox" className="size-4 accent-[#47715A]" checked={bills}
     onChange={e=>{setBills(e.target.checked);setAck(false);}}/>
    {ar?"فواتير مسجلة وغير مؤكدة":"Recorded upcoming bills"}
   </label>
   <label className="inline-flex min-h-10 items-center gap-2">
    <input type="checkbox" className="size-4 accent-[#47715A]" checked={family}
     onChange={e=>{setFamily(e.target.checked);setAck(false);}}/>
    {ar?"المناسبات وأعياد الميلاد":"Family dates and birthdays"}
   </label>
   <label className="inline-flex min-h-10 items-center gap-2">
    <input type="checkbox" className="size-4 accent-[#47715A]" checked={tasksEnabled}
     onChange={e=>{setTasksEnabled(e.target.checked);setAck(false);}}/>
    {ar?"مهام العائلة المفتوحة":"Open household tasks"}
   </label>
   <label className="inline-flex min-h-10 items-center gap-2">
    <input type="checkbox" className="size-4 accent-[#47715A]" checked={shoppingEnabled}
     onChange={e=>{setShoppingEnabled(e.target.checked);setAck(false);}}/>
    {ar?"الهدايا والمشتريات المخططة":"Upcoming gifts and purchases"}
   </label>
  </div>
  <p className="mt-2 text-xs font-semibold">{ar?"موعد جاهز للتصدير: ":"Reminders selected: "}{list.length}</p>
  {list.length>0&&<div className="mt-2 max-h-40 overflow-auto rounded-lg border border-[#E1E9DF] p-2">
   {list.slice(0,12).map(e=><p key={e.key} className="py-1 text-xs">{e.date} · {e.title}</p>)}
   {list.length>12&&<p className="mt-1 text-xs text-muted-foreground">+{list.length-12} {ar?"موعد إضافي":"more"}</p>}
  </div>}
  <label className="mt-3 flex items-start gap-2 text-xs">
   <input type="checkbox" className="mt-0.5 size-4 accent-[#47715A]" checked={ack}
    onChange={e=>setAck(e.target.checked)} disabled={!list.length||!tasksReady||!wishlistReady}/>
   {ar?
    "أفهم أن أسماء الفواتير والمناسبات والمهام والهدايا والمشتريات في الملف قد تنتقل إلى مزود تقويمي عند استيراده. أنا من أقرر استيراده ومشاركته.":
    "I understand importing this file may share bill names, family dates, task names, and shopping/gift plans with my calendar provider. I decide whether and where to import it."}
  </label>
  <Button type="button" variant="outline" className="mt-3" onClick={download}
   disabled={!ack||!list.length||!tasksReady||!wishlistReady}>
   <Download className="size-4"/>{ar?"تنزيل تذكيرات التقويم":"Download calendar reminders"}
  </Button>
  {error&&<p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
 </details>;
}
