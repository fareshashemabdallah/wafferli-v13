import {useRef,useState} from "react";
import {FileCheck2,RotateCcw,ShieldAlert} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useI18n} from "@/lib/i18n";
import {buildLocalBackup} from "@/lib/localDataControls";
import {inspectLocalBackup,restoreLocalSections,type RecoveryPreview,
 type RestorableKey} from "@/lib/backupRestore";

function downloadBackup(filename:string,backup:unknown){
 const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json;charset=utf-8"});
 const url=URL.createObjectURL(blob);
 const link=document.createElement("a");
 link.href=url;link.download=filename;
 document.body.appendChild(link);link.click();link.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}

/** The uploaded file is read ONLY in this browser. The parent reviews the
 * validated sections and the replacement warnings before any local write. */
export function LocalBackupRecovery(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [preview,setPreview]=useState<RecoveryPreview|null>(null);
 const [selected,setSelected]=useState<RestorableKey[]>([]);
 const [confirm,setConfirm]=useState("");
 const [hasSafetyCopy,setHasSafetyCopy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [loading,setLoading]=useState(false);
 const inputRef=useRef<HTMLInputElement>(null);
 const setNewSelection=(keys:RestorableKey[])=>{
  setSelected(keys);setConfirm("");setHasSafetyCopy(false);setNotice("");
 };
 const chooseFile=async(file:File|undefined)=>{
  setPreview(null);setNewSelection([]);setError("");setNotice("");
  if(!file)return;
  if(file.size>5_000_000){
   setError(ar?"الملف أكبر من ٥ ميغابايت.":"Backup file exceeds the 5 MB safety limit.");
   return;
  }
  setLoading(true);
  try{
   const inspected=inspectLocalBackup(await file.text(),window.localStorage);
   setPreview(inspected);
   setSelected(inspected.sections.map(s=>s.key));
  }catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setLoading(false);}
 };
 const needsSafetyCopy=!!preview&&preview.sections.some(s=>selected.includes(s.key)&&s.currentlyStored);
 const saveSafetyCopy=()=>{
  setError("");setNotice("");
  try{
   const backup=buildLocalBackup(window.localStorage);
   if(Object.keys(backup.entries).length===0)
    throw new Error("No existing data is available to back up");
   downloadBackup("dabberna-before-restore-"+new Date().toISOString().slice(0,10)+".json",backup);
   setHasSafetyCopy(true);
   setNotice(ar?
    "تم تجهيز نسخة من بياناتك الحالية. تأكد من وجودها في التنزيلات قبل المتابعة.":
    "A safety backup was generated. Verify that it is in your downloads before proceeding.");
  }catch(e){setError(e instanceof Error?e.message:String(e));}
 };
 const apply=()=>{
  setError("");setNotice("");
  if(!preview||confirm!=="RESTORE"||selected.length===0||
    (needsSafetyCopy&&!hasSafetyCopy))return;
  const prompt=ar?
   "سيتم استبدال الأقسام التي اخترتها فقط، ولن يتم دمجها مع البيانات الموجودة. إذا كنت متأكداً، اضغط موافق.":
   "Replace ONLY the selected sections on this device, without merging records? Other local sections will be left unchanged. Continue?";
  if(!window.confirm(prompt))return;
  try{
   const result=restoreLocalSections(window.localStorage,preview,selected,true);
   setPreview(null);setSelected([]);setConfirm("");setHasSafetyCopy(false);
   setNotice((ar?"تمت استعادة ":"Restored ")+result.restored.length+
    (ar?" أقسام. سيُعاد تحميل التطبيق الآن.":" section(s). The app will reload now."));
   window.location.reload();
  }catch(e){
   setError(e instanceof Error?e.message:String(e));
   setHasSafetyCopy(false);setConfirm("");
  }
 };
 return <section className="mt-3 rounded-xl border border-[#DCE8DB] bg-[#F7FAF5] p-3 sm:p-4"
  aria-label={ar?"استعادة بيانات دبّرنا":"Restore a Dabberna backup"}>
  <div className="flex items-center gap-2">
   <RotateCcw className="size-5 shrink-0 text-brand"/>
   <h3 className="text-sm font-semibold">{ar?"استعادة نسخة احتياطية":"Restore a backup on this device"}</h3>
  </div>
  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?
   "افتح ملف النسخة الذي صدّرته من دبّرنا. سنفحصه محلياً ثم نعرض ما يمكن استعادته. لا نرفع الملف إلى خادم، ولا نربطه بحسابات الأسرة.":
   "Choose a JSON backup exported from Dabberna. It is validated and previewed on this device only. No file content is uploaded or linked to household accounts."}</p>
  <label className="mt-3 block text-xs font-semibold">
   {ar?"اختر ملف JSON":"Choose backup JSON file"}
   <input ref={inputRef} type="file" accept=".json,application/json"
    className="mt-2 block w-full max-w-lg text-xs file:me-3 file:rounded-xl file:border-0 file:bg-[#E9F0E7] file:px-3 file:py-2.5 file:font-semibold file:text-brand"
    onChange={e=>void chooseFile(e.target.files?.[0])}/>
  </label>
  {loading&&<p className="mt-2 text-xs text-muted-foreground">{ar?"نفحص الملف...":"Validating file…"}</p>}
  {error&&<p role="alert" className="mt-3 rounded-lg bg-[#FFF1EE] p-3 text-xs text-[#984C42]">{error}</p>}
  {notice&&<p role="status" className="mt-3 rounded-lg bg-[#EAF4E8] p-3 text-xs text-brand">{notice}</p>}
  {preview&&<div className="mt-4 space-y-3">
   <div className="rounded-xl border border-[#DCE4D9] bg-white p-3 text-xs">
    <p className="font-semibold"><FileCheck2 className="me-1 inline size-4 text-brand"/>
      {ar?"نسخة متوافقة مع هذا الإصدار":"Compatible backup format"}</p>
    <p className="mt-1 text-muted-foreground">{ar?"تاريخ النسخة":"Exported"}: {new Date(preview.exportedAt).toLocaleString(ar?"ar-JO":"en-GB")}</p>
    <p className="mt-2 font-semibold">{ar?"اختر الأقسام التي تريد استبدالها":"Select sections to REPLACE (not merge):"}</p>
    <div className="mt-2 space-y-2">{preview.sections.map(s=>
     <label key={s.key} className="flex items-start gap-2 rounded-lg border border-[#E8EDE4] px-3 py-2">
      <input type="checkbox" className="mt-0.5 size-4 accent-[#507B62]"
       checked={selected.includes(s.key)}
       onChange={e=>setNewSelection(e.target.checked?
        [...selected,s.key]:selected.filter(x=>x!==s.key))}/>
      <span>
       <span className="font-semibold">{s.label}</span>
       <span className="block text-[11px] text-muted-foreground">
        {s.count===null?(ar?"إعدادات":"Settings"):s.count+" "+(ar?"عنصر":"records")}
        {" · "}{s.currentlyStored?(ar?"سيُستبدل الموجود":"Replaces current saved section"):(ar?"قسم جديد":"New section")}
       </span>
      </span>
     </label>)}</div>
   </div>
   {preview.skipped.length>0&&<div className="rounded-xl border border-[#E8D9C8] bg-[#FFF9F2] p-3 text-xs">
    <p className="font-semibold">{ar?"أقسام لا يمكن استعادتها بعد":"Sections excluded from restoration"}</p>
    <p className="mt-1 break-words text-muted-foreground">{preview.skipped.join(" · ")}</p>
    <p className="mt-1 text-muted-foreground">{ar?
     "هذه البيانات تُترك كما هي على جهازك. بعضها يحتوي على رموز دعوة ولا يمكن نقله بأمان بهذه الخطوة.":
     "These sections are left unchanged. Some contain invitation or session-like references and cannot be safely transferred in this workflow."}</p>
   </div>}
   {needsSafetyCopy&&<div className="rounded-xl border border-[#ECDACD] bg-[#FFF9F3] p-3 text-xs">
    <p className="flex items-center gap-2 font-semibold"><ShieldAlert className="size-4 text-[#95664C]"/>
     {ar?"احمِ بياناتك الحالية قبل الاستبدال":"Protect the current data before replacing it"}</p>
    <p className="mt-1 text-muted-foreground">{ar?
     "احفظ أولاً نسخة من هذا المتصفح. تأكد من وصول الملف إلى التنزيلات؛ لا يمكننا التحقق من وجوده على جهازك.":
     "Download the current browser data first and check it reached your Downloads. We cannot verify that your device saved the file."}</p>
    <Button type="button" variant="outline" className="mt-2" onClick={saveSafetyCopy}>
     {ar?"نزّل نسخة احتياطية قبل الاستعادة":"Download current safety backup"}
    </Button>
    {hasSafetyCopy&&<p className="mt-2 font-semibold text-brand">{ar?"راجع ملف التنزيل قبل المتابعة.":"Verify the downloaded file before proceeding."}</p>}
   </div>}
   <p className="text-xs leading-relaxed text-muted-foreground">{ar?
    "قد تنقطع الروابط بين الخطط والمصاريف إذا استعدت قسماً دون الآخر. سجلاتك الأخرى لا تُدمج أو تُحذف، وليست هذه مزامنة سحابية.":
    "Restoring only some sections may leave plan-to-expense links unmatched. Other sections are not merged or deleted. This is NOT cloud synchronization."}</p>
   <label className="block text-xs font-semibold">
    {ar?"اكتب RESTORE للموافقة على استبدال الأقسام المختارة":"Type RESTORE to confirm replacing the selected sections"}
    <input value={confirm} onChange={e=>setConfirm(e.target.value.slice(0,7))}
     autoComplete="off" className="mt-1 block min-h-11 w-full max-w-xs rounded-xl border border-[#D4DFD1] bg-white px-3 text-sm"/>
   </label>
   <Button type="button" disabled={!selected.length||confirm!=="RESTORE"||
    (needsSafetyCopy&&!hasSafetyCopy)} onClick={apply}>
    <RotateCcw className="size-4"/>{ar?"استعِد الأقسام المختارة":"Restore selected sections"}
   </Button>
  </div>}
 </section>;
}
