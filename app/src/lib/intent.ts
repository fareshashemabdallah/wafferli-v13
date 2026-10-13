export type Intent = {
  to: "/explore/together" | "/money" | "/explore/shopping" | "/explore/smartbuy" | "/explore/restaurants" | "/space";
  label: string;
  reply: string;
};

const rules: { words: string[]; intent: Intent }[] = [
  {
    words: ["vote", "friends", "outing", "argeeleh", "arguileh", "shisha", "hangout", "together", "اصدقاء", "أصدقاء", "طلعة", "اركيلة", "أرجيلة", "شباب"],
    intent: { to: "/explore/together", label: "Open Wafferli Together", reply: "Sounds like a group plan. Create a vote and share one link with your friends — they don't need an account." },
  },
  {
    words: ["restaurant", "dinner", "lunch", "eat", "food", "cafe", "مطعم", "عشاء", "غداء", "أكل", "اكل", "كافيه"],
    intent: { to: "/explore/restaurants", label: "Browse restaurants", reply: "Let's look at places to eat. Listings are samples for now — always verify with the restaurant." },
  },
  {
    words: ["budget", "spend", "spent", "salary", "income", "save", "saving", "expense", "bill", "money", "ميزانية", "مصروف", "راتب", "توفير", "فاتورة", "مصاريف"],
    intent: { to: "/money", label: "Open My Money", reply: "This is about your household budget. Check your remaining allowance or log a new expense." },
  },
  {
    words: ["grocer", "supermarket", "milk", "bread", "list", "compare", "carrefour", "basket", "بقالة", "سوبرماركت", "حليب", "خبز", "قائمة", "مقارنة"],
    intent: { to: "/explore/shopping", label: "Open Shopping List", reply: "Let's build your basket. Add items with quantities and prices to see the total." },
  },
  {
    words: ["buy", "shoe", "shirt", "dress", "clothes", "jacket", "phone", "laptop", "price", "اشتري", "شراء", "حذاء", "ملابس", "قميص", "جاكيت", "سعر", "موبايل"],
    intent: { to: "/explore/smartbuy", label: "Open Smart Buy", reply: "Thinking of buying something? Compare options by total cost, including delivery or travel." },
  },
  {
    words: ["family", "kids", "child", "wife", "husband", "household", "عائلة", "أطفال", "اطفال", "زوجة", "زوج"],
    intent: { to: "/space", label: "Open My Space", reply: "Manage your household members and preferences in My Space." },
  },
];

export function routeIntent(q: string): Intent | null {
  const s = q.toLowerCase();
  for (const r of rules) if (r.words.some((w) => s.includes(w))) return r.intent;
  return null;
}