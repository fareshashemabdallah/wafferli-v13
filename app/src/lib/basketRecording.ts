import type {MoneyState} from "./money";

export type BasketEntry={id:string;name:string;qty:number;price:number;done:boolean};
export const basketExpenseId=(cycleId:string)=>"shopping-trip-"+cycleId;
export const isSampleBasketEntry=(item:BasketEntry)=>/\(sample\)/i.test(item.name);

/** Idempotent by shopping-trip ID even on double-taps or after reloading the page. */
export function recordBasketExpense(
 money:MoneyState,items:readonly BasketEntry[],cycleId:string,
 categoryId:string,localDate:string
):MoneyState{
 if(money.demo||!cycleId||!/^[a-f0-9]{24}$/i.test(cycleId))return money;
 if(!money.categories.some(c=>c.id===categoryId)||!/^\d{4}-\d{2}-\d{2}$/.test(localDate))return money;
 if(items.length===0||items.some(i=>isSampleBasketEntry(i)||
  !i.name.trim()||!Number.isFinite(i.qty)||!Number.isInteger(i.qty)||i.qty<1||
  !Number.isFinite(i.price)||i.price<0))return money;
 const amount=Math.round(items.reduce((n,i)=>n+i.qty*i.price,0)*100)/100;
 if(!Number.isFinite(amount)||amount<=0||amount>100000)return money;
 const id=basketExpenseId(cycleId);
 if(money.expenses.some(e=>e.id===id))return money;
 return {...money,expenses:[{
  id,date:localDate,categoryId,amount,note:"Shopping basket",shared:false,status:"paid"
 },...money.expenses]};
}
