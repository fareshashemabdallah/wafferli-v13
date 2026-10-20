import {parseCalendarDate} from "./familyCalendar";
import type {FamilyPlan} from "./familyPlans";

/** Saved inside the existing FamilyPlan occasion gift, not a second wishlist,
 * bill, bank debit or financial transaction. Seller amounts are parent-entered.
 */
export type GiftSellerChoice={
 productName:string;
 store:string;
 totalJod:number;
 checkedByParent:boolean;
 parentCheckedOn?:string;
};
const cents=(n:number)=>Number.isFinite(n)&&n>0&&n<=100000&&
 Math.abs(n*100-Math.round(n*100))<0.00001;
const normalized=(s:string)=>s.trim().replace(/\s+/g," ").toLocaleLowerCase();
export function matchesGiftProduct(giftName:string,comparisonProduct:string):boolean{
 return normalized(giftName).length>=2&&normalized(giftName)===normalized(comparisonProduct);
}
export function selectOccasionGiftSeller(
 plan:FamilyPlan,productName:string,store:string,amountJod:number,
 checkedByParent:boolean,parentCheckedOn:string|undefined,now=new Date()
):FamilyPlan{
 if(plan.kind!=="occasion"||plan.status==="completed"||!plan.occasionPreparation||
  !matchesGiftProduct(plan.occasionPreparation.gift.description,productName)||
  store.trim().length<2||store.trim().length>90||!cents(amountJod)||
  parentCheckedOn!==undefined&&(!checkedByParent||!parseCalendarDate(parentCheckedOn)||
   parentCheckedOn>new Date(now.getFullYear(),now.getMonth(),now.getDate(),12).toISOString().slice(0,10)))return plan;
 const offer:GiftSellerChoice={
  productName:productName.trim().slice(0,100),store:store.trim(),
  totalJod:Math.round(amountJod*100)/100,checkedByParent,
  ...(checkedByParent&&parentCheckedOn?{parentCheckedOn}:{})
 };
 return {...plan,updatedAt:now.toISOString(),occasionPreparation:{
  ...plan.occasionPreparation,
  gift:{...plan.occasionPreparation.gift,selectedQuote:offer}
 }};
}
