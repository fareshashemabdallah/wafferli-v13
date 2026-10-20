/** A parent should not retype a gift saved in Family Life.
 * Only fill an EMPTY local comparison. Never overwrite another product's
 * quotes, the parent's saved ceiling, an existing plan or Money records.
 * This helper has no networking and sends no personal information to sellers.
 */
export type GiftComparisonDraft={product:string;budget:string;alts:readonly unknown[]};
export function prefillGiftComparison<T extends GiftComparisonDraft>(
 draft:T,giftDescription:string,plannedAmountJod:number
):T{
 const name=giftDescription.trim().replace(/\s+/g," ");
 if(name.length<2||name.length>60||draft.product.trim()||draft.alts.length||
  !Number.isFinite(plannedAmountJod)||plannedAmountJod<0||plannedAmountJod>100000)return draft;
 return {...draft,product:name,budget:draft.budget.trim()?
  draft.budget:String(plannedAmountJod)};
}
/** Switching away from an unrelated comparison is an EXPLICIT parent choice.
 * The caller must show confirmation first; only the local comparison is reset.
 */
export function startNewGiftComparison<T extends GiftComparisonDraft>(
 draft:T,giftDescription:string,plannedAmountJod:number
):T{
 const name=giftDescription.trim().replace(/\s+/g," ");
 if(name.length<2||name.length>60||!Number.isFinite(plannedAmountJod)||
  plannedAmountJod<0||plannedAmountJod>100000)return draft;
 return {...draft,product:name,budget:String(plannedAmountJod),alts:[]};
}
