/**
 * Jordan-specific place discovery options. Covers cuisine and restaurant/food style
 * labels found in Jordanian delivery directories; availability varies by area.
 * This taxonomy is NOT a list of verified restaurants or venue cuisine tags.
 */
export type CuisineOption = { id: string; en: string; ar: string; query: string };
export type CuisineGroup = { label: string; options: CuisineOption[] };
export const cuisineGroups: CuisineGroup[] = [
  {
    "label": "Jordanian, Arab & Middle Eastern · عربي وشرق أوسطي",
    "options": [
      {
        "id": "jordanian",
        "en": "Jordanian",
        "ar": "أردني",
        "query": "Jordanian"
      },
      {
        "id": "palestinian",
        "en": "Palestinian",
        "ar": "فلسطيني",
        "query": "Palestinian"
      },
      {
        "id": "lebanese",
        "en": "Lebanese",
        "ar": "لبناني",
        "query": "Lebanese"
      },
      {
        "id": "syrian",
        "en": "Syrian",
        "ar": "سوري",
        "query": "Syrian"
      },
      {
        "id": "arabic",
        "en": "Arabic",
        "ar": "عربي",
        "query": "Arabic"
      },
      {
        "id": "middle-eastern",
        "en": "Middle Eastern",
        "ar": "شرق أوسطي",
        "query": "Middle Eastern food"
      },
      {
        "id": "levantine",
        "en": "Levantine",
        "ar": "شامي",
        "query": "Levantine food"
      },
      {
        "id": "iraqi",
        "en": "Iraqi",
        "ar": "عراقي",
        "query": "Iraqi"
      },
      {
        "id": "yemeni",
        "en": "Yemeni",
        "ar": "يمني",
        "query": "Yemeni"
      },
      {
        "id": "saudi",
        "en": "Saudi",
        "ar": "سعودي",
        "query": "Saudi"
      },
      {
        "id": "gulf",
        "en": "Gulf / Khaleeji",
        "ar": "خليجي",
        "query": "Khaleeji Gulf food"
      },
      {
        "id": "emirati",
        "en": "Emirati",
        "ar": "إماراتي",
        "query": "Emirati"
      },
      {
        "id": "kuwaiti",
        "en": "Kuwaiti",
        "ar": "كويتي",
        "query": "Kuwaiti"
      },
      {
        "id": "bahraini",
        "en": "Bahraini",
        "ar": "بحريني",
        "query": "Bahraini"
      },
      {
        "id": "qatari",
        "en": "Qatari",
        "ar": "قطري",
        "query": "Qatari"
      },
      {
        "id": "omani",
        "en": "Omani",
        "ar": "عُماني",
        "query": "Omani"
      },
      {
        "id": "egyptian",
        "en": "Egyptian",
        "ar": "مصري",
        "query": "Egyptian"
      },
      {
        "id": "moroccan",
        "en": "Moroccan",
        "ar": "مغربي",
        "query": "Moroccan"
      },
      {
        "id": "tunisian",
        "en": "Tunisian",
        "ar": "تونسي",
        "query": "Tunisian"
      },
      {
        "id": "sudanese",
        "en": "Sudanese",
        "ar": "سوداني",
        "query": "Sudanese"
      },
      {
        "id": "iranian",
        "en": "Iranian / Persian",
        "ar": "إيراني / فارسي",
        "query": "Iranian"
      },
      {
        "id": "turkish",
        "en": "Turkish",
        "ar": "تركي",
        "query": "Turkish"
      },
      {
        "id": "kurdish",
        "en": "Kurdish",
        "ar": "كردي",
        "query": "Kurdish"
      },
      {
        "id": "armenian",
        "en": "Armenian",
        "ar": "أرمني",
        "query": "Armenian"
      },
      {
        "id": "mediterranean",
        "en": "Mediterranean",
        "ar": "متوسطي",
        "query": "Mediterranean"
      }
    ]
  },
  {
    "label": "South, East & Southeast Asian · مطابخ آسيوية",
    "options": [
      {
        "id": "asian",
        "en": "Asian / Asian fusion",
        "ar": "آسيوي",
        "query": "Asian"
      },
      {
        "id": "indian",
        "en": "Indian",
        "ar": "هندي",
        "query": "Indian"
      },
      {
        "id": "north-indian",
        "en": "North Indian",
        "ar": "شمال هندي",
        "query": "North Indian"
      },
      {
        "id": "south-indian",
        "en": "South Indian",
        "ar": "جنوب هندي",
        "query": "South Indian"
      },
      {
        "id": "kerala",
        "en": "Kerala",
        "ar": "كيرلا",
        "query": "Kerala"
      },
      {
        "id": "pakistani",
        "en": "Pakistani",
        "ar": "باكستاني",
        "query": "Pakistani"
      },
      {
        "id": "afghani",
        "en": "Afghani",
        "ar": "أفغاني",
        "query": "Afghan"
      },
      {
        "id": "nepalese",
        "en": "Nepalese",
        "ar": "نيبالي",
        "query": "Nepalese"
      },
      {
        "id": "chinese",
        "en": "Chinese",
        "ar": "صيني",
        "query": "Chinese"
      },
      {
        "id": "indo-chinese",
        "en": "Indo-Chinese",
        "ar": "هندي صيني",
        "query": "Indo-Chinese"
      },
      {
        "id": "japanese",
        "en": "Japanese",
        "ar": "ياباني",
        "query": "Japanese"
      },
      {
        "id": "korean",
        "en": "Korean",
        "ar": "كوري",
        "query": "Korean"
      },
      {
        "id": "thai",
        "en": "Thai",
        "ar": "تايلندي",
        "query": "Thai"
      },
      {
        "id": "vietnamese",
        "en": "Vietnamese",
        "ar": "فيتنامي",
        "query": "Vietnamese"
      },
      {
        "id": "filipino",
        "en": "Filipino",
        "ar": "فلبيني",
        "query": "Filipino"
      },
      {
        "id": "indonesian",
        "en": "Indonesian",
        "ar": "إندونيسي",
        "query": "Indonesian"
      },
      {
        "id": "malaysian",
        "en": "Malaysian",
        "ar": "ماليزي",
        "query": "Malaysian"
      },
      {
        "id": "singaporean",
        "en": "Singaporean",
        "ar": "سنغافوري",
        "query": "Singaporean"
      },
      {
        "id": "mongolian",
        "en": "Mongolian",
        "ar": "منغولي",
        "query": "Mongolian"
      },
      {
        "id": "uzbek",
        "en": "Uzbek",
        "ar": "أوزبكي",
        "query": "Uzbek"
      }
    ]
  },
  {
    "label": "European, Americas & international · عالمي",
    "options": [
      {
        "id": "italian",
        "en": "Italian",
        "ar": "إيطالي",
        "query": "Italian"
      },
      {
        "id": "french",
        "en": "French",
        "ar": "فرنسي",
        "query": "French"
      },
      {
        "id": "greek",
        "en": "Greek",
        "ar": "يوناني",
        "query": "Greek"
      },
      {
        "id": "spanish",
        "en": "Spanish",
        "ar": "إسباني",
        "query": "Spanish"
      },
      {
        "id": "portuguese",
        "en": "Portuguese",
        "ar": "برتغالي",
        "query": "Portuguese"
      },
      {
        "id": "german",
        "en": "German",
        "ar": "ألماني",
        "query": "German"
      },
      {
        "id": "british",
        "en": "British",
        "ar": "بريطاني",
        "query": "British"
      },
      {
        "id": "swedish",
        "en": "Swedish",
        "ar": "سويدي",
        "query": "Swedish"
      },
      {
        "id": "russian",
        "en": "Russian",
        "ar": "روسي",
        "query": "Russian"
      },
      {
        "id": "european",
        "en": "European / Continental",
        "ar": "أوروبي",
        "query": "European restaurant"
      },
      {
        "id": "american",
        "en": "American",
        "ar": "أمريكي",
        "query": "American"
      },
      {
        "id": "mexican",
        "en": "Mexican",
        "ar": "مكسيكي",
        "query": "Mexican"
      },
      {
        "id": "brazilian",
        "en": "Brazilian",
        "ar": "برازيلي",
        "query": "Brazilian"
      },
      {
        "id": "argentinian",
        "en": "Argentinian",
        "ar": "أرجنتيني",
        "query": "Argentinian"
      },
      {
        "id": "peruvian",
        "en": "Peruvian",
        "ar": "بيروفي",
        "query": "Peruvian"
      },
      {
        "id": "latin-american",
        "en": "Latin American",
        "ar": "أمريكا اللاتينية",
        "query": "Latin American"
      },
      {
        "id": "jamaican",
        "en": "Jamaican",
        "ar": "جامايكي",
        "query": "Jamaican"
      },
      {
        "id": "african",
        "en": "African",
        "ar": "أفريقي",
        "query": "African"
      },
      {
        "id": "international",
        "en": "International / Fusion",
        "ar": "عالمي / فيوجن",
        "query": "International cuisine"
      }
    ]
  },
  {
    "label": "Dish, dining & dietary styles · أكلات وأنواع الطعام",
    "options": [
      {
        "id": "grills",
        "en": "Grills / BBQ",
        "ar": "مشاوي",
        "query": "BBQ grills"
      },
      {
        "id": "kebab",
        "en": "Kebab",
        "ar": "كباب",
        "query": "Kebab"
      },
      {
        "id": "shawarma",
        "en": "Shawarma",
        "ar": "شاورما",
        "query": "Shawarma"
      },
      {
        "id": "falafel",
        "en": "Falafel",
        "ar": "فلافل",
        "query": "Falafel"
      },
      {
        "id": "foul",
        "en": "Foul / beans",
        "ar": "فول",
        "query": "Foul"
      },
      {
        "id": "mandi",
        "en": "Mandi",
        "ar": "مندي",
        "query": "Mandi"
      },
      {
        "id": "machboos",
        "en": "Machboos",
        "ar": "مكبوس",
        "query": "Machboos"
      },
      {
        "id": "biryani",
        "en": "Biryani",
        "ar": "برياني",
        "query": "Biryani"
      },
      {
        "id": "mezze",
        "en": "Mezze",
        "ar": "مقبلات",
        "query": "Mezze"
      },
      {
        "id": "manaqeesh",
        "en": "Manaqeesh",
        "ar": "مناقيش",
        "query": "Manaqeesh"
      },
      {
        "id": "saj",
        "en": "Saj",
        "ar": "صاج",
        "query": "Saj"
      },
      {
        "id": "burger",
        "en": "Burgers",
        "ar": "برغر",
        "query": "Burgers"
      },
      {
        "id": "pizza",
        "en": "Pizza",
        "ar": "بيتزا",
        "query": "Pizza"
      },
      {
        "id": "pasta",
        "en": "Pasta",
        "ar": "باستا",
        "query": "Pasta"
      },
      {
        "id": "sandwich",
        "en": "Sandwiches",
        "ar": "ساندويشات",
        "query": "Sandwiches"
      },
      {
        "id": "wraps",
        "en": "Wraps",
        "ar": "راب",
        "query": "Wraps"
      },
      {
        "id": "fried-chicken",
        "en": "Fried chicken",
        "ar": "دجاج مقلي",
        "query": "Fried chicken"
      },
      {
        "id": "chicken-wings",
        "en": "Chicken wings",
        "ar": "أجنحة دجاج",
        "query": "Chicken wings"
      },
      {
        "id": "steak",
        "en": "Steakhouse",
        "ar": "ستيك",
        "query": "Steakhouse"
      },
      {
        "id": "seafood",
        "en": "Seafood",
        "ar": "مأكولات بحرية",
        "query": "Seafood"
      },
      {
        "id": "fish-and-chips",
        "en": "Fish & chips",
        "ar": "سمك وبطاطا",
        "query": "Fish and chips"
      },
      {
        "id": "breakfast",
        "en": "Breakfast & brunch",
        "ar": "فطور وبرنش",
        "query": "Breakfast & brunch"
      },
      {
        "id": "bakery",
        "en": "Bakery",
        "ar": "مخبوزات",
        "query": "Bakery"
      },
      {
        "id": "pies",
        "en": "Pies",
        "ar": "فطائر",
        "query": "Pies"
      },
      {
        "id": "cafe",
        "en": "Café / Coffeehouse",
        "ar": "مقهى",
        "query": "Cafe"
      },
      {
        "id": "coffee",
        "en": "Coffee & tea",
        "ar": "قهوة وشاي",
        "query": "Coffee shop"
      },
      {
        "id": "desserts",
        "en": "Desserts",
        "ar": "حلويات",
        "query": "Desserts"
      },
      {
        "id": "arabic-sweets",
        "en": "Arabic sweets",
        "ar": "حلويات عربية",
        "query": "Arabic sweets"
      },
      {
        "id": "cakes",
        "en": "Cakes",
        "ar": "كيك",
        "query": "Cakes"
      },
      {
        "id": "ice-cream",
        "en": "Ice cream / Gelato",
        "ar": "آيس كريم",
        "query": "Ice cream"
      },
      {
        "id": "waffles",
        "en": "Waffles",
        "ar": "وافل",
        "query": "Waffles"
      },
      {
        "id": "crepes",
        "en": "Crepes",
        "ar": "كريب",
        "query": "Crepes"
      },
      {
        "id": "salad",
        "en": "Salads",
        "ar": "سلطات",
        "query": "Salads"
      },
      {
        "id": "healthy",
        "en": "Healthy",
        "ar": "طعام صحي",
        "query": "Healthy food"
      },
      {
        "id": "vegan",
        "en": "Vegan",
        "ar": "نباتي صرف",
        "query": "Vegan restaurant"
      },
      {
        "id": "vegetarian",
        "en": "Vegetarian",
        "ar": "نباتي",
        "query": "Vegetarian restaurant"
      },
      {
        "id": "gluten-free",
        "en": "Gluten-free",
        "ar": "خالٍ من الغلوتين",
        "query": "Gluten-free restaurant"
      },
      {
        "id": "keto",
        "en": "Keto",
        "ar": "كيتو",
        "query": "Keto food"
      },
      {
        "id": "noodles",
        "en": "Noodles",
        "ar": "نودلز",
        "query": "Noodles"
      },
      {
        "id": "ramen",
        "en": "Ramen",
        "ar": "رامن",
        "query": "Ramen"
      },
      {
        "id": "dumplings",
        "en": "Dumplings / Dim sum",
        "ar": "دامبلينغ",
        "query": "Dumplings"
      },
      {
        "id": "sushi",
        "en": "Sushi",
        "ar": "سوشي",
        "query": "Sushi"
      },
      {
        "id": "tacos",
        "en": "Tacos",
        "ar": "تاكو",
        "query": "Tacos"
      },
      {
        "id": "burrito",
        "en": "Burritos",
        "ar": "بوريتو",
        "query": "Burritos"
      },
      {
        "id": "poke",
        "en": "Poke bowls",
        "ar": "بوكي",
        "query": "Poke bowls"
      },
      {
        "id": "rice-bowls",
        "en": "Rice bowls",
        "ar": "أطباق أرز",
        "query": "Rice bowls"
      },
      {
        "id": "street-food",
        "en": "Street food",
        "ar": "طعام الشارع",
        "query": "Street food"
      },
      {
        "id": "fast-food",
        "en": "Fast food",
        "ar": "وجبات سريعة",
        "query": "Fast food"
      },
      {
        "id": "doner",
        "en": "Döner",
        "ar": "دونر",
        "query": "Döner"
      },
      {
        "id": "curry",
        "en": "Curry",
        "ar": "كاري",
        "query": "Curry"
      },
      {
        "id": "koshary",
        "en": "Koshary",
        "ar": "كشري",
        "query": "Koshary"
      }
    ]
  }
];

const all = cuisineGroups.flatMap(group=>group.options);
export function getCuisine(id: string): CuisineOption | undefined {
  return all.find(option => option.id === id);
}
export function getCuisineQuery(id: string): string {
  return getCuisine(id)?.query ?? "";
}
export function getVisibleCuisines(search: string): CuisineGroup[] {
  const q=search.trim().toLocaleLowerCase();
  if(!q) return cuisineGroups;
  return cuisineGroups.map(group=>({
    ...group,options:group.options.filter(option=>
      [option.en,option.ar,option.query].some(value=>value.toLocaleLowerCase().includes(q))
    )
  })).filter(group=>group.options.length>0);
}
