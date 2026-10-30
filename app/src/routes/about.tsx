import {frenchUI} from "@/lib/french";
import {useI18n} from "@/lib/i18n";
import {createFileRoute,Link} from "@tanstack/react-router";
import {AppShell} from "@/components/AppShell";
import {LocalDataControls} from "@/components/LocalDataControls";
import {PrivateVaultPanel} from "@/components/PrivateVaultPanel";

export const Route=createFileRoute("/about")({
 head:()=>({meta:[
  {title:"About & privacy — Dabberna"},
  {name:"description",content:"What Dabberna can really help with, what it cannot verify, and how to protect or export your family data."}
 ]}),component:About
});
export function About(){
 const {lang}=useI18n(),ar=lang==="ar";
 return <AppShell title={ar?"كيف بيساعدك دبّرنا؟":(lang==="fr"?frenchUI("What Dabberna can do today"):"What Dabberna can do today")}>
  <section className="rounded-2xl border border-[#DDE8D9] bg-[#F3F8EF] p-5">
   <h2 className="text-lg font-semibold">{ar?"دبّرنا بيساعدك تقرّر، مش تعبي استمارات":(lang==="fr"?frenchUI("Family support, not more forms"):"Family support, not more forms")}</h2>
   <p className="mt-2 text-sm leading-relaxed">{ar?"ابدأ بسؤال عن مصاريف البيت أو التزامات العيلة أو مناسبة قادمة. دبّرنا يستخدم المعلومات اللي اخترت تحفظها، ويبيّن شو بحاجة لتأكيد.":(lang==="fr"?frenchUI("Start with a question about family Money, an upcoming occasion or a plan. Dabberna uses records you've chosen to save, identifies missing details and suggests a useful next step."):"Start with a question about family Money, an upcoming occasion or a plan. Dabberna uses records you've chosen to save, identifies missing details and suggests a useful next step.")}</p>
   <Link to="/advisor" className="mt-3 inline-flex min-h-11 items-center font-semibold text-brand underline">
    {ar?"اسأل دبّرنا":(lang==="fr"?frenchUI("Ask Dabberna"):"Ask Dabberna")} →
   </Link>
  </section>
  <section className="mt-4 rounded-2xl border border-border bg-white p-5">
   <h2 className="text-base font-semibold">{ar?"ما بيعمله حالياً":(lang==="fr"?frenchUI("Available in this pilot"):"Available in this pilot")}</h2>
   <ul className="mt-2 list-disc space-y-2 ps-5 text-sm leading-relaxed">
    <li>{ar?"عرض الميزانية الشهرية مع تفاصيل ثابتة ومتغيرة ودورية ومصاريف مسجّلة.":(lang==="fr"?frenchUI("Show planned fixed, variable and periodic costs next to expenses recorded on this device."):"Show planned fixed, variable and periodic costs next to expenses recorded on this device.")}</li>
    <li>{ar?"مراجعة التزامات وطلعات العيلة وتجهيز خطة أو تعديلها بموافقتك.":(lang==="fr"?frenchUI("Help review family dates, upcoming commitments and plans you explicitly approve or adjust."):"Help review family dates, upcoming commitments and plans you explicitly approve or adjust.")}</li>
    <li>{ar?"إرشاد محلي حول المصاريف ومواعيد العيلة وخططها المحفوظة دون تكرار البيانات.":(lang==="fr"?frenchUI("Provide device-based financial guidance using your recorded family dates and plans, without duplicating facts or financial transactions."):"Provide device-based financial guidance using your recorded family dates and plans, without duplicating facts or financial transactions.")}</li>
   </ul>
  </section>
  <section className="mt-4 rounded-2xl border border-[#E8DDD0] bg-[#FFF9F1] p-5">
   <h2 className="text-base font-semibold">{ar?"ما بعده مش متاح":(lang==="fr"?frenchUI("Not connected or verified"):"Not connected or verified")}</h2>
   <p className="mt-2 text-sm leading-relaxed">{ar?"المحادثة الذكية المباشرة والبحث عن المنتجات والأماكن ومزايا التسوّق والمجموعات غير متاحة حالياً. الحجز والدفع والمزامنة البنكية تحتاج خدمات موثوقة ومصرّحاً بها. التقديرات ليست رصيد بنك.":(lang==="fr"?frenchUI("Product discovery, shopping lists, outing discovery, and family circles have been retired from this pilot for a future clean redesign. Live AI, bookings, payments and bank synchronization require separate authorized integrations. Planning estimates are not bank-verified funds."):"Product discovery, shopping lists, outing discovery, and family circles have been retired from this pilot for a future clean redesign. Live AI, bookings, payments and bank synchronization require separate authorized integrations. Planning estimates are not bank-verified funds.")}</p>
  </section>
  <details className="mt-4 rounded-2xl border border-[#DEE8DC] bg-white p-4">
   <summary className="min-h-11 cursor-pointer text-sm font-semibold text-brand">
    {ar?"خصوصية العائلة، النسخ الاحتياطي وإدارة البيانات":(lang==="fr"?frenchUI("Family privacy, backup & data controls"):"Family privacy, backup & data controls")}
   </summary>
   <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?"معلومات العيلة والمالية المحفوظة في هذا الإصدار موجودة بهذا المتصفح؛ مسح بيانات الموقع قد يحذفها. راجع خيارات النسخ الاحتياطي قبل التغيير.":(lang==="fr"?frenchUI("Family finances and plans saved in this pilot remain in this browser. Clearing site data may delete them; review your backup options before changing devices."):"Family finances and plans saved in this pilot remain in this browser. Clearing site data may delete them; review your backup options before changing devices.")}</p>
   <LocalDataControls/>
   <PrivateVaultPanel/>
  </details>
 </AppShell>;
}
