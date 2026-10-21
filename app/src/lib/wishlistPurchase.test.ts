import {describe,expect,it} from "vitest";
import {recordWishlistPurchase,wishlistExpenseId} from "./wishlistPurchase";
import {sampleMoney} from "./money";
import {makeWishlistItem} from "./familyWishlist";
const now=new Date("2026-10-21T10:00:00.000Z");
const item=makeWishlistItem({id:"gift-1",name:"School shoes",kind:"children"},now)!;
describe("wishlist purchase: one confirmed expense, no invented savings",()=>{
 it("never charges an item merely because it was shortlisted",()=>{
  const demo=sampleMoney();
  expect(recordWishlistPurchase(demo,item,40,"2026-10-21")).toBe(demo);
  const real={...sampleMoney(),demo:false,expenses:[]};
  expect(recordWishlistPurchase(real,item,0,"2026-10-21")).toBe(real);
  expect(real.expenses).toHaveLength(0);
 });
 it("writes an explicit paid expense at most once and never silently changes cash",()=>{
  const real={...sampleMoney(),demo:false,expenses:[],cashOnHand:200};
  const paid=recordWishlistPurchase(real,item,43.5,"2026-10-21");
  expect(paid.expenses).toHaveLength(1);
  expect(paid.expenses[0]).toMatchObject({id:wishlistExpenseId(item.id),amount:43.5,status:"paid",cashDeducted:false});
  expect(paid.cashOnHand).toBe(200);
  expect(recordWishlistPurchase(paid,item,43.5,"2026-10-21")).toBe(paid);
 });
});
