/**
 * Household permission model for a future authenticated backend.
 * SECURITY NOTICE: These pure functions are for UI previews and policy tests.
 * They are NOT an authorization boundary. Production access MUST be enforced
 * server-side and via PostgreSQL RLS using authenticated identities.
 *
 * Friendship/community groups are NOT a household. Access to community
 * messages or outing votes never implies access to household money.
 */
export type HouseholdRole="owner"|"adult"|"teen"|"child";
export type MembershipStatus="active"|"invited"|"revoked";
export type HouseholdMembership={
 householdId:string;
 userId:string;
 role:HouseholdRole;
 status:MembershipStatus;
};
export type ExpenseVisibility="private"|"adults"|"household";
export type HouseholdExpenseRecord={
 householdId:string;
 createdBy:string;
 visibility:ExpenseVisibility;
};
export type HouseholdPermission="manage-members"|"read-shared-money"|"write-my-expense"|"read-own-expense";

/** Membership is always supplied by the trusted server, not a user-selected profile. */
export function hasHouseholdPermission(
 membership:HouseholdMembership|null,
 permission:HouseholdPermission,
 expectedHouseholdId:string
):boolean {
 if(!membership||membership.status!=="active"||membership.householdId!==expectedHouseholdId||
    !membership.userId.trim())return false;
 if(permission==="manage-members")return membership.role==="owner";
 if(permission==="read-shared-money")return membership.role==="owner"||membership.role==="adult";
 if(permission==="write-my-expense"||permission==="read-own-expense")
   return membership.role==="owner"||membership.role==="adult"||membership.role==="teen";
 return false;
}
/** Private expenses belong only to their author, including between co-parents.
 * Under-18 access is intentionally narrower than adult access.
 */
export function canReadHouseholdExpense(
 viewer:HouseholdMembership|null,
 expense:HouseholdExpenseRecord
):boolean {
 if(!viewer||!hasHouseholdPermission(viewer,"read-own-expense",expense.householdId))return false;
 if(viewer.userId===expense.createdBy)return true;
 return (viewer.role==="owner"||viewer.role==="adult")&&expense.visibility!=="private";
}
/** No member may impersonate another author or write across households.
 * Teen entries are personal-only by default until a reviewed sharing flow exists.
 */
export function canCreateHouseholdExpense(
 actor:HouseholdMembership|null,
 expense:HouseholdExpenseRecord
):boolean {
 if(!actor||!hasHouseholdPermission(actor,"write-my-expense",expense.householdId))return false;
 if(actor.userId!==expense.createdBy)return false;
 if(actor.role==="teen")return expense.visibility==="private";
 return actor.role==="owner"||actor.role==="adult";
}
