import {describe,expect,it} from "vitest";
import {nextWishlistReminder} from "./wishlistAttention";
import {buildFamilyAttention} from "./familyAttention";
import {makeWishlistItem,recordWishlistPrice,updateWishlistStatus} from "./familyWishlist";
import {sampleMoney,sampleMembers} from "./money";
import {defaultFamilyPreferences} from "./familyPreferences";
const now=new Date(2026,9,15,12);
const gift=makeWishlistItem({id:"gift-one",kind:"gift",name:"Birthday gift",
 targetDate:"2026-10-19",budgetJod:25},now)!;
const context=(wishlist= [gift],options:Partial<Parameters<typeof buildFamilyAttention>[0]>={})=>
 buildFamilyAttention({
  money:sampleMoney(),members:sampleMembers(),plans:[],moments:[],tasks:[],wishlist,
  preferences:{...defaultFamilyPreferences,shoppingTips:true},
  preferencesConfirmed:true,now,maxItems:20,...options
 });
describe("private wishlists integrated with attention priorities",()=>{
 it("selects a timely unpurchased gift with no invented merchant price",()=>{
  const reminder=nextWishlistReminder([gift],now);
  expect(reminder?.priceStatus).toBe("missing");
  expect(reminder?.lastRecordedJod).toBeNull();
  expect(reminder?.link).toBe("/occasions");
  const alert=context().find(x=>x.category==="shopping");
  expect(alert?.detailEn).toContain("No price has been checked");
  expect(alert?.detailEn).toContain("No order or payment");
 });
 it("flags stale and over-budget recorded estimates without asserting savings",()=>{
  const old=recordWishlistPrice(gift,{
   id:"check-one",store:"Sample Shop",amountJod:35,checkedAt:"2026-09-23"
  },now);
  const reminder=nextWishlistReminder([old],now);
  expect(reminder?.priceStatus).toBe("stale");
  expect(reminder?.overBudget).toBe(true);
  const alert=context([old]).find(x=>x.category==="shopping");
  expect(alert?.detailEn).toContain("exceeds your chosen ceiling");
 });
 it("respects preference and confirmed consent, and global in-app silence",()=>{
  const disabled=context([gift],{preferences:defaultFamilyPreferences});
  expect(disabled.some(x=>x.category==="shopping")).toBe(false);
  const notConfirmed=context([gift],{preferencesConfirmed:false});
  expect(notConfirmed.some(x=>x.category==="shopping")).toBe(false);
  const muted=context([gift],{preferences:{...defaultFamilyPreferences,
   shoppingTips:true,notificationFrequency:"off"}});
  expect(muted).toEqual([]);
 });
 it("never reminds for purchased, undated, distant or long-past wishlist entries",()=>{
  const done=updateWishlistStatus(gift,"purchased",now);
  expect(nextWishlistReminder([done],now)).toBeNull();
  const later=makeWishlistItem({id:"later",kind:"household",name:"Annual supplies",
   targetDate:"2026-12-01"},now)!;
  const undated=makeWishlistItem({id:"undated",kind:"children",name:"Coat"},now)!;
  expect(nextWishlistReminder([later,undated],now)).toBeNull();
 });
 it("a new day changes the due urgency without changing or spending stored data",()=>{
  const before=JSON.stringify(gift);
  const early=nextWishlistReminder([gift],new Date(2026,9,15,12));
  const near=nextWishlistReminder([gift],new Date(2026,9,18,12));
  expect(early?.daysUntil).toBe(4);
  expect(near?.daysUntil).toBe(1);
  expect(JSON.stringify(gift)).toBe(before);
 });
});
