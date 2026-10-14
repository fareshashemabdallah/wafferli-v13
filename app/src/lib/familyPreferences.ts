export type FamilyPreferences = {
  weather: boolean;
  lifestyle: boolean;
  financeTips: boolean;
  billReminders: boolean;
  shoppingTips: boolean;
  notificationFrequency: "off" | "important" | "gentle";
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
  city: "",
  distanceKm: 15,
  outingLimit: 50,
};
