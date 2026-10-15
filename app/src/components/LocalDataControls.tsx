import {useState} from "react";
import {Download,ShieldCheck,Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useI18n} from "@/lib/i18n";
import {buildLocalBackup,eraseLocalAppData} from "@/lib/localDataControls";
import {LocalBackupRecovery} from "@/components/LocalBackupRecovery";

/** Never transmits personal data or touches auth sessions. Only parents who
 * intentionally click download receive an unencrypted local file. */
export function LocalDataControls(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [confirmation,setConfirmation]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const exportData=()=>{
  setError("");setNotice("");
  try{
   const backup=buildLocalBackup(window.localStorage);
   if(Object.keys(backup.entries).length===0){
    setNotice(ar?"لا توجد بيانات شخصية محفوظة في هذا المتصفح لنسخها.":"No local Dabberna entries were found to export.");
    return;
   }
   const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json;charset=utf-8"});
   const url=URL.createObjectURL(blob);
   const link=document.createElement("a");
   link.href=url;
   link.download="dabberna-local-backup-"+new Date().toISOString().slice(0,10)+".json";
   document.body.appendChild(link);
   link.click();
   link.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),1000);
   setNotice(ar?"تم إنشاء نسخة قابلة للحفظ على جهازك. احفظها بأمان؛ يمكن استعادة بعض الأقسام فقط بعد فحص الملف وتأكيدك.":"Backup file generated for your device. Keep it secure; validated core sections can be restored separately after explicit review.");
  }catch(e){setError(e instanceof Error?e.message:String(e));}
 };
 const clear=()=>{
  setError("");setNotice("");
  if(confirmation!=="DELETE")return;
  if(!window.confirm(ar?
   "سيتم مسح بيانات دبّرنا الموجودة في هذا المتصفح فقط، ولن تتمكن من التراجع. لا يؤثر ذلك على حسابك السحابي أو رسائلك. متابعة؟":
   "Permanently erase Dabberna data from this browser? This cannot be undone and does NOT delete any cloud account or community posts. Continue?"))return;
  try{
   eraseLocalAppData(window.localStorage);
   window.location.reload();
  }catch(e){setError(e instanceof Error?e.message:String(e));}
 };
 return <section className="editorial-card mt-4 p-4 sm:p-5" aria-label={ar?"الخصوصية والنسخ الاحتياطي":"Privacy and local data controls"}>
  <div className="flex items-center gap-3">
   <ShieldCheck className="size-6 shrink-0 text-brand"/>
   <div><h2 className="font-semibold">{ar?"بياناتك بإيدك":"Your data stays in your hands"}</h2>
    <p className="mt-1 text-xs text-muted-foreground">{ar?
     "تُحفظ معلومات المال والعائلة على هذا المتصفح، وليست نسخة احتياطية سحابية.":
     "Money and family details are saved in this browser, not backed up to a cloud account."}</p>
   </div>
  </div>
  <div className="mt-4 rounded-xl border border-[#E0E8DD] bg-[#F7FAF5] p-3">
   <h3 className="text-sm font-semibold">{ar?"حمّل بياناتك":"Export a personal backup"}</h3>
   <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?
    "ملف JSON غير مشفّر يحتوي على مصاريفك وبيانات العائلة والمناسبات والخطط المحفوظة هنا. لا يتضمن كلمات المرور أو جلسات الدخول أو مفاتيح API. يمكن استعادة الأقسام الأساسية التي نتحقق منها، ولا نعيد رموز الدعوات أو ملفات غير مدعومة.":
    "A plain, unencrypted JSON file of locally saved Money, family profiles, calendar and plans. Login sessions and external API keys are excluded. Validated core sections may be restored after reviewing each replacement. Invitation tokens and unsupported sections are excluded."}</p>
   <Button type="button" variant="outline" className="mt-3" onClick={exportData}>
    <Download className="size-4"/>{ar?"نزّل نسختي":"Download my backup"}
   </Button>
  </div>
  <LocalBackupRecovery/>
  <div className="mt-3 rounded-xl border border-[#EBDDD5] bg-[#FEFBF7] p-3">
   <h3 className="text-sm font-semibold">{ar?"امسح بيانات هذا المتصفح":"Erase data on this device"}</h3>
   <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?
    "يحذف المعلومات المحلية فقط، بما فيها المصاريف والملفات العائلية والخطط والتفضيلات. لا يحذف حساب Supabase أو معلومات سبق مشاركتها مع بالغين آخرين.":
    "Clears only Dabberna's local records, including budgets, family profiles, plans and preferences. It does not sign you out, delete your account, remove server-shared expenses or erase community posts."}</p>
   <label className="mt-3 block text-xs font-semibold">
    {ar?"اكتب DELETE للتأكيد":"Type DELETE to enable permanent local deletion"}
    <input value={confirmation} onChange={e=>setConfirmation(e.target.value.slice(0,8))}
     autoComplete="off" className="mt-1 block min-h-11 w-full max-w-xs rounded-xl border border-[#DED5CE] bg-white px-3 text-sm"/>
   </label>
   <Button type="button" variant="outline" disabled={confirmation!=="DELETE"}
    className="mt-3 border-[#D9B6A5] text-[#985C49]" onClick={clear}>
    <Trash2 className="size-4"/>{ar?"احذف بيانات هذا الجهاز":"Erase this device's data"}
   </Button>
  </div>
  {error&&<p role="alert" className="mt-3 text-xs text-[#9B4545]">{error}</p>}
  {notice&&<p role="status" className="mt-3 text-xs text-brand">{notice}</p>}
  <p className="mt-3 text-[11px] text-muted-foreground">{ar?
   "هذه الأدوات لا ترفع بياناتك إلى أي خادم. قبل مسح المتصفح، احتفظ بنسخة خارجية إذا لزم، ويمكنك استعادة الأقسام الأساسية بعد مراجعتها وتأكيدك.":
   "These controls do not upload your data. Keep any export somewhere private. Deleting browser records is irreversible within this pilot."}</p>
 </section>;
}
