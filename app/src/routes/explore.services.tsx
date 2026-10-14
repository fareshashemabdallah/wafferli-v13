import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Search, ShieldAlert, Stethoscope } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/explore/services")({
  head: () => ({ meta: [
    { title: "Find the Right Service — Dabberna" },
    { name: "description", content: "Find family services with transparent links to third-party search; provider reviews are not verified by Dabberna." }
  ] }),
  component: Services
});

const categories = [
  {value:"doctor",en:"Doctors & healthcare",ar:"الأطباء والرعاية الصحية",query:"doctor"},
  {value:"school",en:"Schools & tutors",ar:"المدارس والمدرسون",query:"school tutor"},
  {value:"home",en:"Home services",ar:"الخدمات المنزلية",query:"home maintenance"},
  {value:"activities",en:"Children's activities",ar:"أنشطة الأطفال",query:"children activities"},
  {value:"gifts",en:"Gifts & shopping",ar:"الهدايا والتسوق",query:"gifts shop"}
] as const;

function Services() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [category, setCategory] = useState<(typeof categories)[number]["value"]>("doctor");
  const [city, setCity] = useState("Amman, Jordan");
  const [detail, setDetail] = useState("");
  const [url, setUrl] = useState("");
  const item = categories.find(c=>c.value===category) || categories[0];
  const search = (e:FormEvent) => {
    e.preventDefault();
    const q = [detail.trim().slice(0,90), item.query, city.trim().slice(0,80)].filter(Boolean).join(" ");
    setUrl("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q));
  };
  return <AppShell title={ar?"اختَر الخدمة الأنسب":"Find the Right Service"}>
    <div className="rounded-3xl bg-mint/70 p-5">
      <div className="flex items-center gap-3">
        <Stethoscope className="size-7 text-brand"/>
        <div>
          <h2 className="text-xl font-semibold">{ar?"ابحث عما تحتاجه عائلتك":"Find what your family needs"}</h2>
          <p className="text-sm text-muted-foreground">{ar?"ابدأ بما تحتاجه عائلتك وقارن الملاءمة والجودة والتكلفة. هذا البحث عند الطلب، وليس توصية تلقائية." : "Start with your family’s needs, then weigh suitability, quality and cost. Search is on demand, not an automatic recommendation."}</p>
        </div>
      </div>
    </div>
    <form onSubmit={search} className="card-soft mt-4 space-y-4 p-4">
      <label className="block text-sm font-medium">
        {ar?"نوع الخدمة":"Service category"}
        <select className="mt-1 w-full rounded-xl border border-border bg-background p-3" value={category} onChange={e=>{setCategory(e.target.value as typeof category);setUrl("");}}>
          {categories.map(c=><option value={c.value} key={c.value}>{ar?c.ar:c.en}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium">
        {ar?"ماذا تبحث عنه؟ (اختياري)":"Specialty or search details (optional)"}
        <Input value={detail} maxLength={90} onChange={e=>setDetail(e.target.value)} className="mt-1" placeholder={ar?"مثلاً: طبيب أطفال":"e.g. pediatrician"}/>
      </label>
      <label className="block text-sm font-medium">
        {ar?"المدينة / المنطقة":"City / area"}
        <Input required value={city} maxLength={80} onChange={e=>setCity(e.target.value)} className="mt-1"/>
      </label>
      <Button type="submit" className="w-full"><Search className="size-4"/>{ar?"ابحث عن مصادر خارجية":"Find third-party listings"}</Button>
      {url && <a href={url} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white">
        {ar?"افتح نتائج خرائط Google":"Open Google Maps results"} <ExternalLink className="size-4"/>
      </a>}
    </form>
    <div className="card-soft mt-4 p-4 text-sm">
      <p className="mb-3 text-sm"><Link to="/community" className="font-semibold text-brand">{ar?"اسأل الأصدقاء أو أهالي المدرسة داخل مجموعتك":"Ask your parent or friends circle for firsthand advice"} →</Link></p>
      <p className="mb-3 text-sm"><Link to="/experience" className="font-semibold text-brand">{ar?"ابحث عن تجارب المستخدمين الخاصة بجهة محددة":"Read experiences for a specific provider or place"} →</Link></p>
      <p className="flex gap-2 font-semibold"><ShieldAlert className="size-5 text-brand"/>{ar?"المصادر والمراجعات":"Sources and reviews"}</p>
      <p className="mt-2 text-muted-foreground">{ar
        ? "تفتح هذه الخدمة نتائج بحث طرف ثالث. لا يقوم دبّرنا حالياً بجمع المراجعات أو تحليلها بالذكاء الاصطناعي أو التحقق من تراخيص الأطباء أو المواعيد أو قبول التأمين. راجع المصدر مباشرة وتأكد من المؤهلات والتوافر. المعلومات لا تُعدّ نصيحة طبية."
        : "This pilot opens third-party listings. Dabberna does not yet collect or AI-analyze reviews or verify clinicians' credentials, appointments or insurance acceptance. Check source information and credentials independently. This is not medical advice."}</p>
      <p className="mt-2 text-muted-foreground">{ar
        ? "تقييمات الزيارات الخاصة بالعائلة ميزة مقترحة للمستقبل، وليست مفعّلة في هذه النسخة."
        : "Optional post-visit family reviews are a future feature, not enabled in this pilot."}</p>
    </div>
  </AppShell>;
}
