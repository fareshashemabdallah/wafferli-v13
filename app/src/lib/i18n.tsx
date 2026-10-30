import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useLocalState } from "./storage";
import { arabicUI } from "./arabic";
import { frenchUI } from "./french";
import {readLocal} from "./storage";

export type Lang = "en" | "ar" | "fr";

export function preferredBrowserLanguage(languages:readonly string[]):Lang{
 for(const candidate of languages){const base=candidate.toLowerCase().split("-")[0];
  if(base==="ar"||base==="en"||base==="fr")return base;
 }
 return "en";
}
export function localize(lang:Lang,en:string,ar:string,fr=en):string{
 return lang==="ar"?ar:lang==="fr"?fr:en;
}

const dict = {
  home: { en: "Today", ar: "اليوم" },
  explore: { en: "Discover", ar: "اكتشف" },
  money: { en: "Money", ar: "المالية" },
  plans: { en: "Plans", ar: "خططنا" },
  space: { en: "Family", ar: "العائلة" },
  advisor: { en: "Help Me Decide", ar: "ساعدني أختار" },
  circles: { en: "Circles", ar: "مجموعاتي" },
  about: { en: "About this pilot", ar: "عن هذه التجربة" },
  pilot: { en: "Pilot", ar: "تجريبي" },
  greeting: { en: "Make today a good family day", ar: "لنجعل اليوم أجمل لعائلتنا" },
  askPh: { en: "e.g. family outing, monthly budget, shopping…", ar: "مثلاً: نزهة عائلية، ميزانية الشهر، التسوق…" },
  ask: { en: "Ask", ar: "اسأل" },
  shortcuts: { en: "Choose what matters today", ar: "اختَر ما يهمك اليوم" },
  planOuting: { en: "Plan Together", ar: "نخطط سوا" },
  trackSpend: { en: "Log an expense", ar: "سجّل مصروفاً" },
  shopList: { en: "My Basket", ar: "سلّتي" },
  smartBuy: { en: "Compare & Choose", ar: "قارن واختَر" },
  restaurants: { en: "Eat & Enjoy", ar: "كُل واستمتع" },
  together: { en: "Plan Together", ar: "نخطط سوا" },
  routerNote: { en: "Keyword routing (no AI connected)", ar: "توجيه بالكلمات المفتاحية (بدون ذكاء اصطناعي)" },
  // vote page
  voteFor: { en: "Pick one place", ar: "اختر مكاناً واحداً" },
  yourName: { en: "Your first name (optional)", ar: "اسمك الأول (اختياري)" },
  submitVote: { en: "Submit my vote", ar: "أرسل صوتي" },
  changeVote: { en: "Update my vote", ar: "غيّر صوتي" },
  results: { en: "Live results", ar: "النتائج المباشرة" },
  votedOf: { en: "voted", ar: "صوّتوا" },
  thanks: { en: "Your vote is saved. You can change it anytime.", ar: "تم حفظ صوتك. يمكنك تغييره في أي وقت." },
  noAccount: { en: "No account or app needed. We only store your choice and optional first name.", ar: "لا حاجة لحساب أو تطبيق. نحفظ اختيارك واسمك الأول الاختياري فقط." },
  notFound: { en: "This vote link is invalid or was removed.", ar: "رابط التصويت غير صالح أو تمت إزالته." },
  organizer: { en: "Organized by", ar: "المنظّم" },
} as const;

export type Key = keyof typeof dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string; tr: (s:string)=>string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => dict[k].en,
  tr: (s) => s,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useLocalState<Lang>("lang", "en");
  useEffect(() => {
    // Existing families retain their explicitly chosen Arabic/English value.
    // Only brand-new browser profiles get a device-language suggestion.
    if(readLocal<Lang|null>("lang",null)===null){
      setLang(preferredBrowserLanguage(navigator.languages?.length
        ?navigator.languages:[navigator.language]));
    }
  }, [setLang]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  return <Ctx.Provider value={{ lang, setLang, t: (k) => lang === "ar" ? dict[k].ar : lang === "fr" ? frenchUI(dict[k].en) : dict[k].en, tr: (s) => lang === "ar" ? arabicUI(s) : lang === "fr" ? frenchUI(s) : s }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);