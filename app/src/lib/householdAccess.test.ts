import {describe,expect,it} from "vitest";
import {
 canReadHouseholdExpense,canCreateHouseholdExpense,hasHouseholdPermission,
 type HouseholdMembership,type HouseholdExpenseRecord
} from "./householdAccess";

const owner:HouseholdMembership={householdId:"h1",userId:"parent-a",role:"owner",status:"active"};
const second:HouseholdMembership={householdId:"h1",userId:"parent-b",role:"adult",status:"active"};
const teen:HouseholdMembership={householdId:"h1",userId:"teen-c",role:"teen",status:"active"};
const child:HouseholdMembership={householdId:"h1",userId:"child-d",role:"child",status:"active"};
const expense=(visibility:HouseholdExpenseRecord["visibility"]):HouseholdExpenseRecord=>
 ({householdId:"h1",createdBy:"parent-b",visibility});
describe("future family membership access defaults",()=>{
 it("separates authenticated household access from community friendship",()=>{
  expect(hasHouseholdPermission(owner,"manage-members","h1")).toBe(true);
  expect(hasHouseholdPermission(second,"manage-members","h1")).toBe(false);
  expect(hasHouseholdPermission({...owner,status:"invited"},"read-shared-money","h1")).toBe(false);
  expect(hasHouseholdPermission({...owner,status:"revoked"},"read-shared-money","h1")).toBe(false);
  expect(hasHouseholdPermission(owner,"read-shared-money","different-household")).toBe(false);
 });
 it("does not disclose one parent's private expenses to another parent",()=>{
  expect(canReadHouseholdExpense(owner,expense("private"))).toBe(false);
  expect(canReadHouseholdExpense(second,expense("private"))).toBe(true);
  expect(canReadHouseholdExpense(owner,expense("adults"))).toBe(true);
  expect(canReadHouseholdExpense(owner,expense("household"))).toBe(true);
 });
 it("denies children financial access and limits teens to self-entered expenses",()=>{
  expect(canReadHouseholdExpense(child,expense("household"))).toBe(false);
  expect(canReadHouseholdExpense(teen,expense("household"))).toBe(false);
  expect(canReadHouseholdExpense(teen,{householdId:"h1",createdBy:"teen-c",visibility:"private"})).toBe(true);
  expect(canCreateHouseholdExpense(teen,{householdId:"h1",createdBy:"teen-c",visibility:"private"})).toBe(true);
  expect(canCreateHouseholdExpense(teen,{householdId:"h1",createdBy:"teen-c",visibility:"household"})).toBe(false);
 });
 it("never trusts an impersonated author, revoked user or other household",()=>{
  expect(canCreateHouseholdExpense(owner,expense("household"))).toBe(false);
  expect(canCreateHouseholdExpense(second,expense("household"))).toBe(true);
  expect(canCreateHouseholdExpense({...second,status:"revoked"},expense("household"))).toBe(false);
  expect(canReadHouseholdExpense({...owner,householdId:"h2"},expense("household"))).toBe(false);
  expect(canReadHouseholdExpense(null,expense("household"))).toBe(false);
 });
});
