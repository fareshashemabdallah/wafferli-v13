import {frenchUI} from "@/lib/french";
import {useEffect,useState,type FormEvent} from "react";
import type {User} from "@supabase/supabase-js";
import {CloudUpload,CloudDownload,KeyRound,LockKeyhole,Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useI18n} from "@/lib/i18n";
import {supabase} from "@/integrations/supabase/client";
import {buildLocalBackup} from "@/lib/localDataControls";
import {inspectLocalBackup,type RestorableKey,type RecoverySection} from "@/lib/backupRestore";
import {decryptPrivateBackup,encryptPrivateBackup,preparePrivateVaultSnapshot} from "@/lib/privateVaultCrypto";
import {fetchPersonalVault,removePersonalVault,uploadPersonalVault,
 PRIVATE_VAULT_ENABLED,type PersonalVaultRow} from "@/lib/privateVaultApi";

function saveFile(json:string,name:string){
 const url=URL.createObjectURL(new Blob([json],{type:"application/json;charset=utf-8"}));
 const a=document.createElement("a");
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
/** Not mounted in normal public builds. The vault is exclusively for
 * the authenticated person, NOT for automatically sharing household money. */
export function PrivateVaultPanel(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [user,setUser]=useState<User|null>(null);
 const [email,setEmail]=useState("");
 const [authReady,setAuthReady]=useState(false);
 const [available,setAvailable]=useState<RecoverySection[]>([]);
 const [selected,setSelected]=useState<RestorableKey[]>([]);
 const [remote,setRemote]=useState<PersonalVaultRow|null>(null);
 const [pass,setPass]=useState("");
 const [repeat,setRepeat]=useState("");
 const [consent,setConsent]=useState(false);
 const [deletion,setDeletion]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");

 useEffect(()=>{
  if(!PRIVATE_VAULT_ENABLED)return;
  let live=true;
  void supabase.auth.getUser().then(({data,error})=>{
   if(live){setUser(error?null:data.user);setAuthReady(true);}
  }).catch(()=>{if(live){setUser(null);setAuthReady(true);}});
  const {data}=supabase.auth.onAuthStateChange((_event,session)=>{
   if(live){setUser(session?.user??null);if(!session){setRemote(null);setSelected([]);setPass("");setRepeat("");}}
  });
  return ()=>{live=false;data.subscription.unsubscribe();};
 },[]);
 useEffect(()=>{
  if(!PRIVATE_VAULT_ENABLED||!user){setRemote(null);setAvailable([]);return;}
  let live=true;
  try{
   const p=inspectLocalBackup(JSON.stringify(buildLocalBackup(window.localStorage)),window.localStorage);
   if(live)setAvailable(p.sections);
  }catch{if(live)setAvailable([]);}
  void fetchPersonalVault().then(r=>{if(live)setRemote(r);})
   .catch(e=>{if(live)setError(e instanceof Error?e.message:String(e));});
  return ()=>{live=false;};
 },[user?.id]);
 const act=async(fn:()=>Promise<void>)=>{
  if(busy)return;
  setBusy(true);setError("");setMessage("");
  try{await fn();}catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setBusy(false);}
 };
 const sendLink=(e:FormEvent)=>{
  e.preventDefault();
  void act(async()=>{
   const address=email.trim();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))
    throw new Error("Please enter a valid email");
   const redirect=window.location.origin+import.meta.env.BASE_URL+"#/about";
   const {error}=await supabase.auth.signInWithOtp({email:address,options:{emailRedirectTo:redirect}});
   if(error)throw error;
   setMessage(ar?"تحقق من بريدك لرابط الدخول.":(lang==="fr"?frenchUI("Check your email for the sign-in link."):"Check your email for the sign-in link."));
  });
 };
 const put=()=>void act(async()=>{
  if(!consent||selected.length===0||pass.length<14||pass!==repeat)
   throw new Error("Select sections, confirm consent and enter the same 14+ character passphrase twice");
  const {json,sections}=preparePrivateVaultSnapshot(window.localStorage,selected);
  if(!window.confirm(ar?"سيتم رفع نسخة مشفرة من الأقسام المحددة لحسابك الخاص فقط. لا تشاركها مع باقي أفراد الأسرة. متابعة؟":(lang==="fr"?frenchUI("Upload an encrypted copy of ONLY the selected sections to your own account? This does not share them with other household members. Continue?"):"Upload an encrypted copy of ONLY the selected sections to your own account? This does not share them with other household members. Continue?")))return;
  // Check remote state immediately before writing and require its passphrase
  // before replacing an existing personal snapshot.
  const latest=await fetchPersonalVault();
  if(latest)await decryptPrivateBackup(latest.envelope,pass);
  const encrypted=await encryptPrivateBackup(json,pass);
  const next=await uploadPersonalVault(encrypted,latest?.revision??0);
  setRemote(await fetchPersonalVault());
  setPass("");setRepeat("");setConsent(false);setSelected([]);
  setMessage((ar?"حُفظت نسخة مشفرة من ":(lang==="fr"?frenchUI("Saved encrypted copies of "):"Saved encrypted copies of "))+sections.length+
   (ar?" أقسام، إصدار ":(lang==="fr"?frenchUI(" section(s), version "):" section(s), version "))+next+".");
 });
 const download=()=>void act(async()=>{
  if(!remote)throw new Error("No encrypted vault has been saved");
  const plaintext=await decryptPrivateBackup(remote.envelope,pass);
  const inspected=inspectLocalBackup(plaintext,window.localStorage);
  if(!window.confirm(ar?"سيتم تنزيل نسخة JSON غير مشفرة على هذا الجهاز. تحتوي على بيانات شخصية؛ احفظها بأمان واستخدم الاستعادة المحلية بعد مراجعتها. متابعة؟":(lang==="fr"?frenchUI("Download a DECRYPTED JSON backup onto this device? It contains sensitive personal information. Store it securely, then use the local restore preview. Continue?"):"Download a DECRYPTED JSON backup onto this device? It contains sensitive personal information. Store it securely, then use the local restore preview. Continue?")))return;
  saveFile(plaintext,"dabberna-decrypted-vault-"+new Date().toISOString().slice(0,10)+".json");
  setPass("");setRepeat("");
  setMessage((ar?"تم تنزيل النسخة. راجع ":(lang==="fr"?frenchUI("Decrypted backup downloaded with "):"Decrypted backup downloaded with "))+inspected.sections.length+
   (ar?" أقسام. استخدم الاستعادة المحلية أدناه.":(lang==="fr"?frenchUI(" validated sections. Use the local Restore panel to review before importing."):" validated sections. Use the local Restore panel to review before importing.")));
 });
 const remove=()=>void act(async()=>{
  if(deletion!=="DELETE VAULT")return;
  if(!window.confirm(ar?"حذف النسخة المشفرة الموجودة في حسابك؟ لا يحذف بيانات هذا الجهاز ولا يضمن مسح النسخ الاحتياطية للخادم فوراً.":(lang==="fr"?frenchUI("Delete the encrypted copy in YOUR account? This does not delete this device's data and cannot guarantee instant removal from provider backups."):"Delete the encrypted copy in YOUR account? This does not delete this device's data and cannot guarantee instant removal from provider backups.")))return;
  await removePersonalVault();
  setRemote(null);setDeletion("");setPass("");setRepeat("");
  setMessage(ar?"تم إرسال طلب حذف النسخة المشفرة.":(lang==="fr"?frenchUI("Your encrypted vault record has been deleted from active storage."):"Your encrypted vault record has been deleted from active storage."));
 });
 if(!PRIVATE_VAULT_ENABLED)return null;
 return <section className="editorial-card mt-4 p-4 sm:p-5"
  aria-label={ar?"نسخة خاصة مشفرة عبر الأجهزة":(lang==="fr"?frenchUI("Encrypted personal backup across devices"):"Encrypted personal backup across devices")}>
  <div className="flex items-start gap-3">
   <LockKeyhole className="size-7 shrink-0 text-brand"/>
   <div><h2 className="text-base font-semibold">{ar?"خزنتك الخاصة المشفرة":(lang==="fr"?frenchUI("Your private encrypted vault"):"Your private encrypted vault")}</h2>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?"أداة تجريبية لتخزين نسخة مشفّرة من أقسام تختارها أنت ضمن حسابك الشخصي فقط. ليست مزامنة تلقائية بين الأب والأم، ولا يستطيع فريق دبّرنا استعادة كلمة المرور.":(lang==="fr"?frenchUI("Staged opt-in encrypted backup for your own signed-in account only. Not automatic parent-to-parent sync. Dabberna cannot recover a lost vault passphrase."):"Staged opt-in encrypted backup for your own signed-in account only. Not automatic parent-to-parent sync. Dabberna cannot recover a lost vault passphrase.")}</p>
   </div>
  </div>
  {error&&<p role="alert" className="mt-3 rounded-xl bg-[#FFF0ED] p-3 text-xs text-[#924638]">{error}</p>}
  {message&&<p role="status" className="mt-3 rounded-xl bg-[#EBF4EB] p-3 text-xs text-brand">{message}</p>}
  {!authReady?<p className="mt-3 text-xs">{ar?"التحقق من الجلسة":(lang==="fr"?frenchUI("Checking account…"):"Checking account…")}</p>:!user?
   <form onSubmit={sendLink} className="mt-4 space-y-2">
    <p className="text-xs font-semibold">{ar?"سجّل دخولك ببريدك الخاص":(lang==="fr"?frenchUI("Sign in with your own email"):"Sign in with your own email")}</p>
    <Input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
    <Button type="submit" disabled={busy}><KeyRound className="size-4"/>{ar?"إرسال رابط الدخول":(lang==="fr"?frenchUI("Send sign-in link"):"Send sign-in link")}</Button>
   </form>:<>
   <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
    <p className="text-muted-foreground">{user.email??(ar?"حساب موثق":(lang==="fr"?frenchUI("Signed in"):"Signed in"))}</p>
    <Button variant="outline" size="sm" disabled={busy} onClick={()=>void act(async()=>{
      const {error}=await supabase.auth.signOut();if(error)throw error;
    })}>{ar?"خروج":(lang==="fr"?frenchUI("Sign out"):"Sign out")}</Button>
   </div>
   <p className="mt-3 rounded-xl bg-[#F4F8F1] p-3 text-xs">{remote?
    (ar?"نسخة مشفرة موجودة، الإصدار ":(lang==="fr"?frenchUI("Encrypted copy available · revision "):"Encrypted copy available · revision "))+remote.revision+
      (ar?"، آخر تحديث ":(lang==="fr"?frenchUI(" · updated "):" · updated "))+new Date(remote.updated_at).toLocaleString(ar?"ar-JO":(lang==="fr"?frenchUI("en-GB"):"en-GB")):
    (ar?"لا توجد نسخة مشفرة بعد في هذا الحساب.":(lang==="fr"?frenchUI("No encrypted vault is currently stored in this account."):"No encrypted vault is currently stored in this account."))}</p>
   <div className="mt-4 space-y-3 rounded-xl border border-[#DEE8DC] bg-white p-3">
    <h3 className="text-sm font-semibold">{ar?"١. اختر ما تريد حفظه مشفراً":(lang==="fr"?frenchUI("1. Choose exactly what to encrypt and save"):"1. Choose exactly what to encrypt and save")}</h3>
    {available.length===0?<p className="text-xs text-muted-foreground">{ar?"لا توجد أقسام صالحة محفوظة في هذا المتصفح.":(lang==="fr"?frenchUI("No valid local core sections found on this device."):"No valid local core sections found on this device.")}</p>:
     available.map(s=><label key={s.key} className="flex items-start gap-2 rounded-lg bg-[#F6FAF4] p-2.5 text-xs">
      <input type="checkbox" className="mt-0.5 size-4 accent-[#47715A]" checked={selected.includes(s.key)}
       onChange={e=>{setSelected(current=>e.target.checked?[...current,s.key]:current.filter(x=>x!==s.key));setConsent(false);}}/>
      <span>{s.label}{s.count!==null?" · "+s.count:""}</span>
     </label>)}
    <label className="block text-xs font-semibold">{ar?"كلمة مرور طويلة للنسخة (١٤ حرفاً على الأقل)":(lang==="fr"?frenchUI("Your vault passphrase (14 characters minimum)"):"Your vault passphrase (14 characters minimum)")}
     <Input type="password" autoComplete="new-password" value={pass} minLength={14} maxLength={200}
      onChange={e=>setPass(e.target.value)} className="mt-1"/>
    </label>
    <label className="block text-xs font-semibold">{ar?"أعد كلمة المرور للتحقق":(lang==="fr"?frenchUI("Repeat passphrase before uploading"):"Repeat passphrase before uploading")}
     <Input type="password" autoComplete="new-password" value={repeat} minLength={14} maxLength={200}
      onChange={e=>setRepeat(e.target.value)} className="mt-1"/>
    </label>
    <label className="flex items-start gap-2 text-xs">
     <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-0.5 size-4 accent-[#47715A]"/>
     {ar?"أوافق على رفع نسخة مشفرة من الأقسام المحددة إلى حسابي الخاص فقط. لا تتم مشاركة أي بند مع أفراد العائلة تلقائياً.":(lang==="fr"?frenchUI("I explicitly agree to upload an encrypted copy of ONLY the checked sections to my own account. Nothing is automatically shared with my household."):"I explicitly agree to upload an encrypted copy of ONLY the checked sections to my own account. Nothing is automatically shared with my household.")}
    </label>
    <Button disabled={busy||!consent||selected.length===0||pass.length<14||pass!==repeat} onClick={put}>
     <CloudUpload className="size-4"/>{remote?(ar?"استبدل النسخة المشفرة":(lang==="fr"?frenchUI("Replace encrypted snapshot"):"Replace encrypted snapshot")):(ar?"احفظ نسخة مشفرة":(lang==="fr"?frenchUI("Upload encrypted snapshot"):"Upload encrypted snapshot"))}
    </Button>
    {remote&&<p className="text-[11px] text-muted-foreground">{ar?"لاستبدال نسخة موجودة، استخدم كلمة المرور القديمة الصحيحة. سنمنع الكتابة إذا تغيّر إصدار النسخة على جهاز آخر.":(lang==="fr"?frenchUI("To replace an existing snapshot, provide its current passphrase. If another device changed its revision, the upload will be rejected."):"To replace an existing snapshot, provide its current passphrase. If another device changed its revision, the upload will be rejected.")}</p>}
   </div>
   {remote&&<div className="mt-3 rounded-xl border border-[#DCE6DD] p-3">
    <h3 className="text-sm font-semibold">{ar?"٢. استرد نسخة من جهاز آخر":(lang==="fr"?frenchUI("2. Retrieve your own backup on another device"):"2. Retrieve your own backup on another device")}</h3>
    <p className="mt-1 text-xs text-muted-foreground">{ar?"أدخل كلمة مرور النسخة أعلاه ثم نزّل ملف JSON غير مشفر، واختره في أداة الاستعادة المحلية. لا نستورد البيانات تلقائياً.":(lang==="fr"?frenchUI("Enter the vault passphrase above, decrypt and download a plain JSON file, then review it in the local Restore tool. No automatic merge or financial upload."):"Enter the vault passphrase above, decrypt and download a plain JSON file, then review it in the local Restore tool. No automatic merge or financial upload.")}</p>
    <Button variant="outline" className="mt-3" disabled={busy||pass.length<14} onClick={download}>
     <CloudDownload className="size-4"/>{ar?"فك التشفير وتنزيل النسخة":(lang==="fr"?frenchUI("Decrypt & download for local restore"):"Decrypt & download for local restore")}
    </Button>
   </div>}
   {remote&&<div className="mt-3 rounded-xl border border-[#ECDAD1] bg-[#FFF9F6] p-3">
    <h3 className="text-sm font-semibold">{ar?"٣. احذف نسختك السحابية":(lang==="fr"?frenchUI("3. Delete your personal vault"):"3. Delete your personal vault")}</h3>
    <p className="mt-1 text-xs text-muted-foreground">{ar?"حذف النسخة المشفرة لا يمسح جهازك أو أعضاء الأسرة الآخرين أو نسخ الأرشفة لدى مزود الخدمة فوراً.":(lang==="fr"?frenchUI("Deleting your encrypted server copy leaves device-local information untouched. Historical provider backups may remain under retention controls."):"Deleting your encrypted server copy leaves device-local information untouched. Historical provider backups may remain under retention controls.")}</p>
    <label className="mt-2 block text-xs font-semibold">{ar?"اكتب DELETE VAULT للتأكيد":(lang==="fr"?frenchUI("Type DELETE VAULT"):"Type DELETE VAULT")}
     <Input value={deletion} autoComplete="off" onChange={e=>setDeletion(e.target.value.slice(0,12))} className="mt-1"/>
    </label>
    <Button variant="outline" className="mt-2 border-[#D7B9AA] text-[#9A5C45]" disabled={busy||deletion!=="DELETE VAULT"} onClick={remove}>
     <Trash2 className="size-4"/>{ar?"احذف نسختي":(lang==="fr"?frenchUI("Delete encrypted vault"):"Delete encrypted vault")}
    </Button>
   </div>}
  </>}
  <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{ar?"لا تتم مزامنة تلقائية، ولا يتم إرسال كلمة المرور. فك التشفير في المتصفح لا يمنع اختراق الجهاز أو صفحة غير موثوقة. لا تستخدم هذه الميزة قبل مراجعة قاعدة البيانات والأمان في بيئة اختبار.":(lang==="fr"?frenchUI("No automatic sync or passphrase transmission. Browser-side encryption cannot prevent compromised devices or malicious website code. Staging database and multi-account security tests are required before public use."):"No automatic sync or passphrase transmission. Browser-side encryption cannot prevent compromised devices or malicious website code. Staging database and multi-account security tests are required before public use.")}</p>
 </section>;
}
