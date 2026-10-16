/** A parent-initiated bridge to outing planning. No cash, bills, children,
 * account IDs or precise location are ever stored in this draft. */
export const WEEKEND_HANDOFF_KEY="weekendOutingPlanDraft";
export type WeekendPlanDraft={budgetJod:number;createdAt:string;city:string;from:string;to:string};
export function usableWeekendDraft(value:unknown,now=new Date()):WeekendPlanDraft|null{
 if(!value||typeof value!=="object")return null;
 const v=value as Record<string,unknown>;
 if(typeof v["budgetJod"]!=="number"||!Number.isFinite(v["budgetJod"])||
  v["budgetJod"]<5||v["budgetJod"]>100000||
  typeof v["city"]!=="string"||!["Amman","Irbid","Zarqa","Aqaba"].includes(v["city"])||
  typeof v["from"]!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v["from"])||
  typeof v["to"]!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v["to"])||
  typeof v["createdAt"]!=="string")return null;
 const created=new Date(v["createdAt"]).getTime(),age=now.getTime()-created;
 if(!Number.isFinite(created)||age<0||age>24*3600000)return null;
 return {budgetJod:v["budgetJod"],city:v["city"],from:v["from"],to:v["to"],
  createdAt:v["createdAt"]};
}
