import {describe,expect,it} from "vitest";
import {prefillGiftComparison,startNewGiftComparison} from "./giftComparisonHandoff";
const empty=()=>({product:"",budget:"",alts:[] as Array<{id:string;price:string}>});
describe("safe gift comparison continuation",()=>{
 it("uses the existing saved gift name and ceiling only for a new, empty comparison",()=>{
  const before=empty();
  const after=prefillGiftComparison(before,"  Science   kit  ",70);
  expect(after).toEqual({product:"Science kit",budget:"70",alts:[]});
  expect(before).toEqual(empty());
  expect(prefillGiftComparison(after,"Science kit",70)).toBe(after);
 });
 it("preserves an entered budget ceiling and never invents seller prices",()=>{
  const before={...empty(),budget:"95"};
  expect(prefillGiftComparison(before,"Art set",60)).toEqual({
   product:"Art set",budget:"95",alts:[]
  });
  expect(prefillGiftComparison(empty(),"Gift",0).alts).toEqual([]);
 });
 it("does not overwrite unrelated product research even if its name is blank",()=>{
  const prior={product:"School uniform",budget:"100",alts:[{id:"a",price:"25"}]};
  expect(prefillGiftComparison(prior,"Art set",60)).toBe(prior);
  const noName={product:"",budget:"60",alts:[{id:"b",price:"40"}]};
  expect(prefillGiftComparison(noName,"Art set",60)).toBe(noName);
 });
 it("rejects unusable gift names and planned amounts without touching saved state",()=>{
  const prior=empty();
  expect(prefillGiftComparison(prior,"X",50)).toBe(prior);
  expect(prefillGiftComparison(prior,"A".repeat(61),50)).toBe(prior);
  expect(prefillGiftComparison(prior,"Book",Number.POSITIVE_INFINITY)).toBe(prior);
  expect(startNewGiftComparison(prior,"Book",-1)).toBe(prior);
 });
 it("switches only the local comparison when already explicitly confirmed by the parent",()=>{
  const prior={product:"Office chair",budget:"150",alts:[{id:"r1",price:"45"}]};
  expect(startNewGiftComparison(prior,"Art set",65)).toEqual({product:"Art set",budget:"65",alts:[]});
  expect(prior).toEqual({product:"Office chair",budget:"150",alts:[{id:"r1",price:"45"}]});
 });
});
