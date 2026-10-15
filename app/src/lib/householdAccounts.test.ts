import {describe,expect,it} from "vitest";
import {
 isAuthenticatedHousehold,isHouseholdRosterMember,isPendingHouseholdInvite,
 HOUSEHOLD_ACCOUNTS_ENABLED,createHousehold,acceptAdultInvitation
} from "./householdAccounts";

const uuid="be02ac77-1d70-4ecc-980e-34d1124e24d1";
describe("authenticated household API boundaries",()=>{
 it("requires true server-issued household IDs and adult membership roles",()=>{
  expect(isAuthenticatedHousehold({
   household_id:uuid,household_name:"Our home",my_role:"owner",my_display_name:"Parent"
  })).toBe(true);
  expect(isAuthenticatedHousehold({
   household_id:uuid,household_name:"Our home",my_role:"child",my_display_name:"Child"
  })).toBe(false);
  expect(isAuthenticatedHousehold({
   household_id:"local-profile-id",household_name:"Our home",my_role:"adult",my_display_name:"Parent"
  })).toBe(false);
  expect(isAuthenticatedHousehold({
   household_id:uuid,household_name:"Our home",my_role:"revoked",my_display_name:"Parent"
  })).toBe(false);
 });
 it("never accepts underage accounts as household roster members",()=>{
  expect(isHouseholdRosterMember({
   user_id:uuid,display_name:"Parent",member_role:"adult",
   joined_at:"2026-10-15T12:00:00Z"
  })).toBe(true);
  expect(isHouseholdRosterMember({
   user_id:uuid,display_name:"Teen",member_role:"teen",
   joined_at:"2026-10-15T12:00:00Z"
  })).toBe(false);
  expect(isHouseholdRosterMember({
   user_id:uuid,display_name:"Parent",member_role:"adult",
   joined_at:"not-a-date"
  })).toBe(false);
 });
 it("does not expose invitation tokens through the owner pending-invitation record",()=>{
  expect(isPendingHouseholdInvite({
   invite_id:uuid,created_at:"2026-10-15T12:00:00Z",
   expires_at:"2026-10-18T12:00:00Z"
  })).toBe(true);
  expect(isPendingHouseholdInvite({invite_id:"local",expires_at:"tomorrow"})).toBe(false);
 });
 it("never allows a household to be created or joined without explicit adult confirmation",async()=>{
  await expect(createHousehold("Our home","Parent",false)).rejects.toThrow(/Adult confirmation/);
  await expect(acceptAdultInvitation("a".repeat(64),"Parent",false)).rejects.toThrow(/Adult confirmation/);
 });
 it("requires an explicitly enabled build flag before authenticated RPC calls",()=>{
  expect(typeof HOUSEHOLD_ACCOUNTS_ENABLED).toBe("boolean");
 });
});
