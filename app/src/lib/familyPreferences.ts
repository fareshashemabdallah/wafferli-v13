export type FamilyPreferences = {
  weather: boolean;
  lifestyle: boolean;
  financeTips: boolean;
  billReminders: boolean;
  shoppingTips: boolean;
  notificationFrequency: "off" | "important" | "gentle";
  experienceMode?: "auto" | "individual" | "family";
  /** Defaults for a new outing form, never overrides that specific outing choice. */
  typicalChildrenAttendance?: "ask" | "yes" | "no";
  typicalOutingFocus?: "children" | "mixed" | "adults";
  city: string;
  distanceKm: number;
  outingLimit: number;
};
export const defaultFamilyPreferences: FamilyPreferences = {
  weather: true,
  lifestyle: true,
  financeTips: true,
  billReminders: true,
  shoppingTips: false,
  notificationFrequency: "important",
  experienceMode: "auto",
  typicalChildrenAttendance: "ask",
  typicalOutingFocus: "mixed",
  city: "",
  distanceKm: 15,
  outingLimit: 50,
};
