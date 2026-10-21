import type {MoneyState} from "./money";
import type {WishlistItem} from "./familyWishlist";
import {recordConfirmedExpense} from "./confirmedExpense";

export const wishlistExpenseId=(id:string)=>"wishlist-paid-"+id;
/** One explicit, confirmed payment. Never interprets a wishlist, quotation,
 * budget or selected offer as a paid expense; never debits cash silently. */
export function recordWishlistPurchase(
 money:MoneyState,item:WishlistItem,amount:number,date:string
):MoneyState{
 if(item.status!=="considering"||!item.id||
  !Number.isFinite(amount)||amount<=0||amount>100000||
  Math.abs(amount*100-Math.round(amount*100))>0.000001)return money;
 return recordConfirmedExpense(money,{
  id:wishlistExpenseId(item.id),date,amount,categoryId:"uncategorized",
  note:("Wishlist purchase: "+item.name).slice(0,160)
 },"untracked");
}
