import {dateKey,shiftDays,parseCalendarDate} from "./familyCalendar";
import {summarizeWishlistPrice,type WishlistItem} from "./familyWishlist";
export type WishlistReminder={
 item:WishlistItem;daysUntil:number;priceStatus:"missing"|"stale"|"recent";
 overBudget:boolean;lastRecordedJod:number|null;link:"/occasions"|"/explore/smartbuy";
};
/** Only parent-entered, unpaid wishlist intentions are considered.
 * No external prices, merchant availability or purchase history inferred.
 */
export function nextWishlistReminder(items:readonly WishlistItem[],now=new Date()):WishlistReminder|null{
 const today=dateKey(now);
 const soon=dateKey(shiftDays(now,14));
 const thirtyDaysAgo=dateKey(shiftDays(now,-30));
 const candidates=items.filter(i=>i.status==="considering"&&i.targetDate&&
   !!parseCalendarDate(i.targetDate)&&i.targetDate>=thirtyDaysAgo&&i.targetDate<=soon)
  .sort((a,b)=>a.targetDate!.localeCompare(b.targetDate!)||a.name.localeCompare(b.name));
 const item=candidates[0];
 if(!item||!item.targetDate)return null;
 const dateStart=new Date(today+"T12:00:00Z").getTime();
 const targetStart=new Date(item.targetDate+"T12:00:00Z").getTime();
 const days=Math.round((targetStart-dateStart)/86400000);
 const latest=summarizeWishlistPrice(item).latest;
 const last=latest?.checkedAt;
 const stale=!last||!parseCalendarDate(last)||last>today||
  last<dateKey(shiftDays(now,-14));
 return {
  item,daysUntil:days,priceStatus:latest?(stale?"stale":"recent"):"missing",
  overBudget:!!latest&&item.budgetJod!==undefined&&latest.amountJod>item.budgetJod,
  lastRecordedJod:latest?.amountJod??null,
  link:item.kind==="gift"?"/occasions":"/explore/smartbuy"
 };
}
