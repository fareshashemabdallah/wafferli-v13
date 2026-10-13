export type Restaurant = {
  id: string;
  name: string;
  cuisine: "Lebanese" | "Levantine" | "Grill" | "Cafe";
  argeeleh: boolean;
  budget: 1 | 2 | 3;
  area: string;
  note: string;
};

/** SAMPLE placeholder listings — not real, unverified. */
export const sampleRestaurants: Restaurant[] = [
  { id: "r1", name: "Sample Lebanese Terrace", cuisine: "Lebanese", argeeleh: true, budget: 2, area: "Abdoun", note: "Mezze & grills, outdoor seating (sample)" },
  { id: "r2", name: "Sample Rainbow St. Café", cuisine: "Cafe", argeeleh: true, budget: 1, area: "Jabal Amman", note: "Casual, argeeleh lounge (sample)" },
  { id: "r3", name: "Sample Beirut House", cuisine: "Lebanese", argeeleh: false, budget: 3, area: "Sweifieh", note: "Family dining, no argeeleh (sample)" },
  { id: "r4", name: "Sample Grill Garden", cuisine: "Grill", argeeleh: true, budget: 2, area: "Khalda", note: "Mixed grill, large groups (sample)" },
  { id: "r5", name: "Sample Levant Kitchen", cuisine: "Levantine", argeeleh: false, budget: 1, area: "Jabal Al-Weibdeh", note: "Budget-friendly mezze (sample)" },
  { id: "r6", name: "Sample Rooftop Lounge", cuisine: "Lebanese", argeeleh: true, budget: 3, area: "Abdoun", note: "Rooftop, evenings (sample)" },
];

export const budgetLabel = (b: number) => "JD".repeat(b);