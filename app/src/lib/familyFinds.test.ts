import {describe,expect,it} from "vitest";
import {addFindListing,blankFindDraft,changeFindStatus,editFindListing,
 findWishMatches,makeFindListing,readFindDraft,safeFindImage,validateFindWish} from "./familyFinds";
import {emptyRealMoney} from "./moneyOverview";
const now="2026-10-26T10:00:00.000Z";
const draft=()=>({...blankFindDraft(),title:"Illustrated storybooks",offer:"sell-swap" as const,
 price:"35.50",wanted:"Puzzles for ages 4–6",area:"Amman",description:"Good condition"});
describe("Family Finds private pilot listing model",()=>{
 it("records a price and exchange wish in ONE listing without creating extra records",()=>{
  const listing=makeFindListing(draft(),"bike-1",now);
  expect(listing).not.toBeNull();
  expect(listing).toMatchObject({offer:"sell-swap",priceJod:35.50,wanted:"Puzzles for ages 4–6",status:"available"});
  expect(addFindListing([],listing!)).toHaveLength(1);
  expect(addFindListing([listing!],listing!)).toHaveLength(1);
 });
 it("keeps swap-only and Share the Joy free of prices",()=>{
  const swap=makeFindListing({...draft(),offer:"swap",price:"80"},"swap-1",now);
  const gift=makeFindListing({...draft(),offer:"share",price:"50",wanted:"Anything"},"share-1",now);
  expect(swap?.priceJod).toBeUndefined();
  expect(gift?.priceJod).toBeUndefined();
  expect(gift?.wanted).toBeUndefined();
  expect(gift?.offer).toBe("share");
 });
 it("requires price to sell, and a wish or open mind to swap",()=>{
  expect(makeFindListing({...draft(),price:""},"x",now)).toBeNull();
  expect(makeFindListing({...draft(),price:"0"},"x",now)).toBeNull();
  expect(makeFindListing({...draft(),wanted:"",openOffers:false},"x",now)).toBeNull();
  expect(makeFindListing({...draft(),offer:"swap",wanted:"",openOffers:true},"x",now)).not.toBeNull();
  expect(makeFindListing({...draft(),price:"12.345"},"x",now)).toBeNull();
 });
 it("edits one canonical listing preserving identity and status",()=>{
  const one=makeFindListing(draft(),"one",now)!;
  const completed=changeFindStatus([one],"one","completed");
  const changed=makeFindListing({...readFindDraft(completed[0]!),title:"Updated Storybooks"},"one","2026-10-27T10:00:00.000Z",completed[0])!;
  const updated=editFindListing(completed,changed);
  expect(updated).toHaveLength(1);
  expect(updated[0]).toMatchObject({id:"one",title:"Updated Storybooks",status:"completed",createdAt:now});
  expect(updated[0]!.priceJod).toBe(35.50);
 });
 it("rejects specific address-like numbers and oversized/untrusted images",()=>{
  expect(makeFindListing({...draft(),area:"Apartment 123456"},"x",now)).toBeNull();
  expect(safeFindImage("https://example.org/item.png")).toBe(false);
  expect(safeFindImage("data:image/svg+xml;base64,YQ==")).toBe(false);
  expect(safeFindImage("data:image/jpeg;base64,YQ==")).toBe(true);
  expect(makeFindListing({...draft(),imageDataUrl:"https://example.org/x.jpg"},"x",now)).toBeNull();
 });
 it("keeps wish matching read-only and never fabricates other parents",()=>{
  const item=makeFindListing(draft(),"item",now)!;
  const wish=validateFindWish({description:"Storybooks for age four",category:"books"},"w1",now)!;
  const items=[item];
  const before=JSON.stringify(items);
  expect(findWishMatches(items,[wish])).toEqual([{listingId:"item",wishId:"w1",reason:"keyword"}]);
  expect(JSON.stringify(items)).toEqual(before);
 });
 it("does not modify Money, Plans or create payment records",()=>{
  const money=emptyRealMoney(),before=JSON.stringify(money);
  const item=makeFindListing(draft(),"item",now)!;
  changeFindStatus([item],"item","completed");
  expect(JSON.stringify(money)).toEqual(before);
  expect(money.expenses).toHaveLength(0);
  expect(money.commitments).toHaveLength(0);
 });
});
