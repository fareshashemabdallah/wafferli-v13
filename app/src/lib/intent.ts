export type Intent = {
  to: "/explore/together" | "/money" | "/explore/shopping" | "/explore/market" | "/explore/restaurants" | "/space";
  label: string;
  reply: string;
};

const rules: { words: string[]; intent: Intent }[] = [
  {
    words: ["vote", "friends", "outing", "argeeleh", "arguileh", "shisha", "hangout", "together", "اصدقاء", "أصدقاء", "طلعة", "اركيلة", "أرجيلة", "شباب"],
    intent: { to: "/explore/together", label: "Open Plan Together", reply: "Sounds like a group plan. Create a vote and share one link with your friends — they don't need an account." },
  },
  {
    words: ["restaurant", "dinner", "lunch", "eat", "food", "cafe", "مطعم", "عشاء", "غداء", "أكل", "اكل", "كافيه"],
    intent: { to: "/explore/restaurants", label: "Eat & Enjoy", reply: "Let's look at places to eat. Browse actual OpenStreetMap entries in Amman. Ratings, argeeleh, prices and opening hours are not verified." },
  },
  {
    words: ["budget", "spend", "spent", "salary", "income", "save", "saving", "expense", "bill", "money", "ميزانية", "مصروف", "راتب", "توفير", "فاتورة", "مصاريف"],
    intent: { to: "/money", label: "Our Finances", reply: "Know what your family can comfortably afford, and enjoy spending on what matters." },
  },
  {
    words: ["grocer", "supermarket", "milk", "bread", "list", "compare", "carrefour", "basket", "بقالة", "سوبرماركت", "حليب", "خبز", "قائمة", "مقارنة"],
    intent: { to: "/explore/shopping", label: "Open My Basket", reply: "Let's build your basket. Add items with quantities and prices to see the total." },
  },
  {
    words: ["buy", "shoe", "shirt", "dress", "clothes", "jacket", "phone", "laptop", "price", "اشتري", "شراء", "حذاء", "ملابس", "قميص", "جاكيت", "سعر", "موبايل"],
    intent: { to: "/explore/market", label: "Find seller listings", reply: "Search real retailer pages for the product first, then verify its price, availability and delivery with the seller." },
  },
  {
    words: ["family", "kids", "child", "wife", "husband", "household", "عائلة", "أطفال", "اطفال", "زوجة", "زوج"],
    intent: { to: "/space", label: "My Family", reply: "Personalize your household preferences in My Family." },
  },
];

export function routeIntent(q: string): Intent | null {
  const s = q.toLowerCase();
  for (const r of rules) if (r.words.some((w) => s.includes(w))) return r.intent;
  return null;
}