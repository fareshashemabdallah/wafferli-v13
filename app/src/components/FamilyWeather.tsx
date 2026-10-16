import { CloudSun, MapPin, Umbrella } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useLocalState } from "@/lib/storage";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {preferredWeatherCity} from "@/lib/weatherCity";

const places = [
  { name: "Amman", ar: "عمّان", lat: 31.9539, lon: 35.9106 },
  { name: "Irbid", ar: "إربد", lat: 32.5556, lon: 35.85 },
  { name: "Zarqa", ar: "الزرقاء", lat: 32.0728, lon: 36.087 },
  { name: "Aqaba", ar: "العقبة", lat: 29.5267, lon: 35.0078 }
];
type Forecast = { temperature: number; rain: number | null; code: number };

export function FamilyWeather() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [selected, setSelected] = useLocalState<string>("weatherCity", "");
  const [prefs] = useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
  const city = preferredWeatherCity(prefs.city,selected);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [status, setStatus] = useState<"idle"|"loading"|"error"|"ready">("idle");
  useEffect(() => {
    const place = places.find((p) => p.name === city);
    if (!place) { setForecast(null); setStatus("idle"); return; }
    const controller = new AbortController();
    setStatus("loading");
    setForecast(null);
    const u = new URL("https://api.open-meteo.com/v1/forecast");
    u.searchParams.set("latitude", String(place.lat));
    u.searchParams.set("longitude", String(place.lon));
    u.searchParams.set("current", "temperature_2m,weather_code");
    u.searchParams.set("daily", "precipitation_probability_max");
    u.searchParams.set("timezone", "auto");
    u.searchParams.set("forecast_days", "1");
    fetch(u.toString(), {signal:controller.signal}).then(async r => {
      if (!r.ok) throw new Error("Weather temporarily unavailable");
      const data = await r.json();
      const temp = Number(data?.current?.temperature_2m);
      if (!Number.isFinite(temp)) throw new Error("Invalid weather");
      const probability = data?.daily?.precipitation_probability_max?.[0];
      if (!Number.isFinite(Number(data?.current?.weather_code))) throw new Error("Invalid weather");
      if (!controller.signal.aborted) {
        setForecast({temperature:temp,code:Number(data.current.weather_code),rain:Number.isFinite(Number(probability)) && probability != null ? Number(probability) : null});
        setStatus("ready");
      }
    }).catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [city]);
  const tip = !forecast ? "" : [
    forecast.temperature < 13
      ? (ar ? "الجو بارد؛ قد يحتاج الأطفال إلى جاكيت دافئ." : "It's chilly; a warmer jacket may help the children.")
      : forecast.temperature < 21
        ? (ar ? "قد تفيد طبقة خفيفة أو جاكيت عند الخروج." : "A light layer or jacket may be useful outdoors.")
        : forecast.temperature > 27
          ? (ar ? "الطقس حار؛ الملابس الخفيفة والماء خيار مناسب." : "It's warm; light clothing and water are a good idea.")
          : (ar ? "الطقس معتدل؛ ملابس مريحة ومناسبة للنشاط." : "Mild conditions; comfortable layers should work."),
    forecast.rain !== null && forecast.rain >= 45
      ? (ar ? "هناك احتمال للمطر اليوم؛ خذوا مظلة." : "Rain is possible today; consider bringing an umbrella.")
      : ""
  ].filter(Boolean).join(" ");
  return (
    <section className="card-soft mt-4 p-4" aria-label={ar ? "الطقس للعائلة" : "Family weather"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-2xl bg-mint text-brand"><CloudSun className="size-5"/></span>
          <div>
            <h2 className="font-semibold">{ar ? "طقس اليوم لعائلتك" : "Today's family weather"}</h2>
            <p className="text-xs text-muted-foreground">{ar ? "نصيحة بسيطة للملابس والخروج" : "A small tip for getting ready"}</p>
          </div>
        </div>
        <label className="inline-flex items-center gap-1.5 text-sm">
          <MapPin className="size-4 text-muted-foreground"/>
          <span className="sr-only">{ar ? "اختر المدينة" : "Choose city"}</span>
          <select className="rounded-xl border border-border bg-background px-2 py-2 text-sm" value={city} onChange={e=>setSelected(e.target.value)}>
            <option value="">{ar ? "اختر المدينة" : "Choose city"}</option>
            {places.map(p=><option value={p.name} key={p.name}>{ar?p.ar:p.name}</option>)}
          </select>
        </label>
      </div>
      {!city && <p className="mt-3 text-sm text-muted-foreground">{ar ? "اختر مدينتك لعرض الطقس الحقيقي. لا حاجة لتفعيل تتبّع الموقع." : "Choose your city for a live forecast. No location tracking is required."}</p>}
      {status==="loading" && <p className="mt-3 text-sm text-muted-foreground">{ar ? "جارٍ التحقق من حالة الطقس..." : "Checking the forecast…"}</p>}
      {status==="error" && <p className="mt-3 text-sm text-muted-foreground" role="status">{ar ? "الطقس غير متاح حالياً. حاول لاحقاً." : "Weather is temporarily unavailable. Please try later."}</p>}
      {status==="ready" && forecast && <div className="mt-3 flex items-start gap-3">
        <Umbrella className="mt-1 size-5 shrink-0 text-brand-2"/>
        <div>
          <p className="font-semibold tabular-nums">{Math.round(forecast.temperature)}°C{forecast.rain!==null && <span className="ms-2 text-sm font-normal text-muted-foreground">{ar?"احتمال المطر":"Rain chance"} {forecast.rain}%</span>}</p>
          <p className="mt-1 text-sm text-ink">{tip}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{ar ? "المصدر: Open-Meteo · نصيحة عامة وليست توجيهاً طبياً" : "Source: Open-Meteo · General advice, not medical guidance"}</p>
        </div>
      </div>}
    </section>
  );
}
