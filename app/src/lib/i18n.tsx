import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useLocalState } from "./storage";
import { arabicUI } from "./arabic";

export type Lang = "en" | "ar";

const dict = {
  home: { en: "Home", ar: "الرئيسية" },
  explore: { en: "Explore", ar: "استكشف" },
  money: { en: "My Money", ar: "أموالي" },
  space: { en: "Family", ar: "عائلتي" },
  advisor: { en: "Advisor", ar: "المساعد" },
  community: { en: "Groups", ar: "المجموعات" },
  about: { en: "About this pilot", ar: "عن هذه التجربة" },
  pilot: { en: "Pilot", ar: "تجريبي" },
  greeting: { en: "Welcome to your family space", ar: "أهلاً بكم في مساحة العائلة" },
  askPh: { en: "e.g. family outing, monthly budget, shopping…", ar: "مثلاً: نزهة عائلية، ميزانية الشهر، التسوق…" },
  ask: { en: "Ask", ar: "اسأل" },
  shortcuts: { en: "Quick actions", ar: "إجراءات سريعة" },
  planOuting: { en: "Plan an outing", ar: "خطط لطلعة" },
  trackSpend: { en: "Log an expense", ar: "سجّل مصروفاً" },
  shopList: { en: "Shopping list", ar: "قائمة التسوق" },
  smartBuy: { en: "Smart Buy", ar: "الشراء الذكي" },
  restaurants: { en: "Restaurants", ar: "المطاعم" },
  together: { en: "Dabberna Together", ar: "دبّرنا سوا" },
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
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  return <Ctx.Provider value={{ lang, setLang, t: (k) => dict[k][lang], tr: (s) => lang === "ar" ? arabicUI(s) : s }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);