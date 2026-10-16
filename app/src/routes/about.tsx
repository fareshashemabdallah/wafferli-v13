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
function About(){
 const {lang}=useI18n(),ar=lang==="ar";
 return <AppShell title={ar?"كيف بيساعدك دبّرنا؟":"What Dabberna can do today"}>
  <section className="rounded-2xl border border-[#DDE8D9] bg-[#F3F8EF] p-5">
   <h2 className="text-lg font-semibold">{ar?"دبّرنا بيساعدك تقرّر، مش تعبي استمارات":"Family support, not more forms"}</h2>
   <p className="mt-2 text-sm leading-relaxed">{ar?
    "ابدأ بسؤال عن الميزانية أو نشاط عائلي أو شراء. دبّرنا يقدر يستفيد من البيانات اللي اخترت تحفظها، ويوضح شو بيعرف وشو بحاجة لتأكيد.":
    "Start with a question about money, a family outing or a purchase. Dabberna can use records you've chosen to save, identify missing details and suggest the next useful step."}</p>
   <Link to="/advisor" className="mt-3 inline-flex min-h-11 items-center font-semibold text-brand underline">
    {ar?"اسأل دبّرنا":"Ask Dabberna"} →
   </Link>
  </section>
  <section className="mt-4 rounded-2xl border border-border bg-white p-5">
   <h2 className="text-base font-semibold">{ar?"ما بيعمله حالياً":"Available in this pilot"}</h2>
   <ul className="mt-2 list-disc space-y-2 ps-5 text-sm leading-relaxed">
    <li>{ar?"عرض الميزانية الشهرية مع تفاصيل ثابتة ومتغيرة ودورية ومصاريف مسجّلة.":
     "Show planned fixed, variable and periodic costs next to expenses recorded on this device."}</li>
    <li>{ar?"مراجعة التزامات وطلعات العيلة وتجهيز خطة أو تعديلها بموافقتك.":
     "Help review family dates, upcoming commitments and plans you explicitly approve or adjust."}</li>
    <li>{ar?"إرشاد محلي حول المصاريف، وروابط للمصادر والمنتجات والأماكن التي تراجعها أنت.":
     "Provide device-based financial guidance and source links for products, services and mapped places."}</li>
   </ul>
  </section>
  <section className="mt-4 rounded-2xl border border-[#E8DDD0] bg-[#FFF9F1] p-5">
   <h2 className="text-base font-semibold">{ar?"ما بعده مش متاح":"Not connected or verified"}</h2>
   <p className="mt-2 text-sm leading-relaxed">{ar?
    "المحادثة الذكية المباشرة، الأسعار المؤكدة، الحجز والدفع والمزامنة البنكية ومتابعة المعلومات بالخلفية بحاجة لخدمات مؤمنة ومصادر موثوقة. لا تتعامل مع التقديرات كرصيد بنك.":
    "Live generative AI, verified retailer prices, bookings, payments, bank sync and reliable background monitoring require separate authorized integrations. Planning estimates are not bank-verified funds."}</p>
  </section>
  <details className="mt-4 rounded-2xl border border-[#DEE8DC] bg-white p-4">
   <summary className="min-h-11 cursor-pointer text-sm font-semibold text-brand">
    {ar?"خصوصية العائلة، النسخ الاحتياطي وإدارة البيانات":"Family privacy, backup & data controls"}
   </summary>
   <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?
    "معلومات العيلة والمالية المحفوظة في هذا الإصدار موجودة بهذا المتصفح؛ مسح بيانات الموقع قد يحذفها. راجع خيارات النسخ الاحتياطي قبل التغيير.":
    "Family finances and plans saved in this pilot remain in this browser. Clearing site data may delete them; review your backup options before changing devices."}</p>
   <LocalDataControls/>
   <PrivateVaultPanel/>
  </details>
 </AppShell>;
}
