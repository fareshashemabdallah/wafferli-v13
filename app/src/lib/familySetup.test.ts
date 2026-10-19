import {describe,expect,it} from "vitest";
import {familySetupState,isSampleFamilyMember,realFamilyMembers} from "./familySetup";
import {sampleMembers,sampleMoney,type Member} from "./money";
import {applyStarterBudget} from "./starterBudget";

const adult:Member={id:"new-parent",name:"Parent",role:"adult",ageGroup:"30–44",prefs:""};
describe("genuine household setup",()=>{
 it("never counts demo people as real family or infers real children",()=>{
  const samples=sampleMembers();
  expect(samples.every(isSampleFamilyMember)).toBe(true);
  expect(realFamilyMembers(samples)).toEqual([]);
  const state=familySetupState(samples,sampleMoney(),false);
  expect(state).toMatchObject({completed:0,next:"family",sampleProfiles:3,hasRealFamily:false});
 });
 it("recognises a newly added real family member while preserving sample records",()=>{
  const members=[...sampleMembers(),adult];
  expect(realFamilyMembers(members)).toEqual([adult]);
  expect(familySetupState(members,sampleMoney(),false).hasRealFamily).toBe(true);
 });
 it("tracks each existing setup step and never edits financial records",()=>{
  const money=applyStarterBudget(sampleMoney(),{income:2000,spending:1200,savings:250});
  const s=familySetupState([adult],money,true);
  expect(s).toMatchObject({completed:2,next:null,sampleProfiles:0});
  expect(money.categories[0]?.planned).toBe(1200);
  expect(s.steps.map(x=>x.complete)).toEqual([true,true]);
 });
 it("lets parents explicitly skip family profiles without fabricating members",()=>{
  const money=applyStarterBudget(sampleMoney(),{income:1400,spending:900,savings:100});
  const s=familySetupState([],money,true,true);
  expect(s).toMatchObject({completed:2,next:null,hasRealFamily:false});
  expect(realFamilyMembers([])).toEqual([]);
 });
 it("does not demand a second confirmation just because preferences were left at default",()=>{
  const money=applyStarterBudget(sampleMoney(),{income:1400,spending:900,savings:100});
  expect(familySetupState([adult],money,false).next).toBeNull();
 });
 it("accepts one useful estimate without treating missing data as zero or nagging for setup",()=>{
  const partial={...sampleMoney(),demo:false,income:0,categories:[{id:"household-essential",name:"Essential",type:"fixed" as const,planned:350}],expenses:[]};
  expect(familySetupState([adult],partial,false).next).toBeNull();
 });
});
