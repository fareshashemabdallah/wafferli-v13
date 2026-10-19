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
  /** Discovery ordering only: never infer income or replace parental choice. */
  discoveryPriority?:"quality"|"balance"|"affordable";
  freeActivitiesFirst?:boolean;
  activityGroupPreference?:"any"|"girls"|"boys"|"separate";
  instructorPreference?:"any"|"female"|"male";
  parentCanObservePreferred?:boolean;
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
  discoveryPriority:"balance",
  freeActivitiesFirst:false,
  activityGroupPreference:"any",
  instructorPreference:"any",
  parentCanObservePreferred:false,
};
