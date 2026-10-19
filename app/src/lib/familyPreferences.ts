import type {DecisionScenario,DecisionApproach,FamilyValue} from "./sixPillarDecisionEngine";
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
  /** Selected care dimension, not a grade or income/social class. */
  moneyJourneyFocus?:"understand"|"protect"|"prepare"|"live";
  /** A reading acknowledgment only: never confirms a payment, cash position or completed task. */
  moneyJourneyLastReviewedWeek?:string;
  /** Parents opt in to priorities; no inference from salary, religion or age. */
  protectedFamilyValues?:FamilyValue[];
  /** Local-only positive preference counts; not prompts, expenses or profiles. */
  decisionLearningEnabled?:boolean;
  decisionFeedback?:Partial<Record<DecisionScenario,Partial<Record<DecisionApproach,number>>>>;
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
  moneyJourneyFocus:"prepare",
  protectedFamilyValues:[],
  decisionLearningEnabled:false,
};
