/**
 * DESTRUCTIVE isolated Supabase staging RLS tests. NEVER production.
 * Usage: node scripts/verify-staging-security.mjs
 * Requires explicitly gated environment variables; see docs/staging-security-gates.md.
 * Auth uses pre-seeded disposable password accounts, never a browser service role.
 */
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {createClient} from "@supabase/supabase-js";

const env=process.env;
function fail(message){throw new Error(message);}
const required=[
 "DABBERNA_CONFIRM_STAGING","DABBERNA_STAGING_URL","DABBERNA_STAGING_PROJECT_REF",
 "DABBERNA_STAGING_ANON_KEY",
 ...["A","B","C"].flatMap(c=>["DABBERNA_TEST_"+c+"_EMAIL","DABBERNA_TEST_"+c+"_PASSWORD"])
];
for(const key of required)if(!env[key])fail("Missing required staging variable: "+key);
if(env.DABBERNA_CONFIRM_STAGING!=="DISPOSABLE_PROJECT_ONLY")
 fail("Explicit staging-only confirmation is required");
const url=new URL(env.DABBERNA_STAGING_URL);
if(url.protocol!=="https:"||url.username||url.password||
   url.hostname!==(env.DABBERNA_STAGING_PROJECT_REF+".supabase.co")||
   !/^[a-z0-9]{8,40}$/.test(env.DABBERNA_STAGING_PROJECT_REF)||
   env.DABBERNA_STAGING_PROJECT_REF==="izevfgdynsrlwgsczllr")
 fail("Refusing a non-disposable staging URL or the existing public project");
const anonKey=env.DABBERNA_STAGING_ANON_KEY;
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const client=()=>createClient(url.origin,anonKey,options);
const a=client(),b=client(),c=client(),anonymous=client();

function ok(result,meaning){
 if(result.error)fail(meaning+": "+result.error.message);
 return result.data;
}
function denied(result,meaning){assert.ok(result.error,meaning+" should be denied");}
async function signIn(client,label){
 const result=await client.auth.signInWithPassword({
  email:env["DABBERNA_TEST_"+label+"_EMAIL"],
  password:env["DABBERNA_TEST_"+label+"_PASSWORD"]
 });
 if(result.error||!result.data.user?.id)
  fail("Failed to authenticate isolated staging user "+label);
 return result.data.user.id;
}
function checkNoRows(result,message){
 const rows=ok(result,message);
 assert.ok(Array.isArray(rows)&&rows.length===0,message+" should return no rows");
}
async function run(){
 console.log("Running destructive tenant security tests on EXPLICIT DISPOSABLE staging project");
 const [idA,idB,idC]=await Promise.all([
  signIn(a,"A"),signIn(b,"B"),signIn(c,"C")
 ]);
 assert.equal(new Set([idA,idB,idC]).size,3,"Three distinct auth identities required");
 const nonce=randomBytes(6).toString("hex");
 const household=ok(await a.rpc("dabberna_create_household",{
  p_name:"SECURITY_TEST_"+nonce,p_display_name:"Test Owner",
  p_adult_attested:true
 }),"Owner create household");
 assert.match(household,/^[0-9a-f-]{36}$/i);
 console.log("Household created with explicit adult attestation");
 denied(await anonymous.rpc("dabberna_create_household",{
  p_name:"Unsafe",p_display_name:"Anon",p_adult_attested:true
 }),"Anonymous household creation");
 denied(await b.rpc("dabberna_create_adult_invite",{p_household_id:household}),
  "Nonowner invite");
 checkNoRows(await c.from("dabberna_households").select("id").eq("id",household),
  "Unrelated user household SELECT");
 denied(await c.rpc("dabberna_household_roster",{p_household_id:household}),
  "Unrelated user roster");
 denied(await c.from("dabberna_household_members").insert({
  household_id:household,user_id:idC,display_name:"Forgery",
  role:"owner",status:"active",adult_attested_at:new Date().toISOString()
 }),"Direct forged household member insert");
 denied(await c.from("dabberna_household_invites").select("*"),
  "Invitation table direct SELECT");
 const invite=ok(await a.rpc("dabberna_create_adult_invite",{
  p_household_id:household
 }),"Create one-use invitation");
 assert.match(invite,/^[0-9a-f]{64}$/i);
 denied(await b.rpc("dabberna_accept_adult_invite",{
  p_code:invite,p_display_name:"Parent B",p_adult_attested:false
 }),"Invitation without adult attestation");
 const joined=ok(await b.rpc("dabberna_accept_adult_invite",{
  p_code:invite,p_display_name:"Parent B",p_adult_attested:true
 }),"Accept one-use invitation");
 assert.equal(joined,household);
 denied(await c.rpc("dabberna_accept_adult_invite",{
  p_code:invite,p_display_name:"User C",p_adult_attested:true
 }),"Invitation replay by unrelated user");
 denied(await b.rpc("dabberna_household_roster",{p_household_id:household}),
  "Ordinary adult roster access");
 const roster=ok(await a.rpc("dabberna_household_roster",{
  p_household_id:household
 }),"Owner household roster");
 assert.equal(roster.length,2);
 console.log("Invitation attestation, replay, owner-only roster and tenant isolation pass");

 // Stage-only selected expense: category, amount and day are fictional.
 const today=new Date().toISOString().slice(0,10);
 const fingerprint=randomBytes(32).toString("hex");
 const payload={p_household_id:household,p_source_fingerprint:fingerprint,
  p_category:"TEST Food",p_amount_fils:15000,p_occurred_on:today};
 denied(await b.rpc("dabberna_share_one_expense",{
  ...payload,p_explicit_consent:false
 }),"Expense sharing without per-item consent");
 denied(await c.rpc("dabberna_share_one_expense",{
  ...payload,p_source_fingerprint:randomBytes(32).toString("hex"),
  p_explicit_consent:true
 }),"Unrelated user expense publishing");
 const expense=ok(await b.rpc("dabberna_share_one_expense",{
  ...payload,p_explicit_consent:true
 }),"Adult publishes explicitly consented item");
 denied(await b.rpc("dabberna_share_one_expense",{
  ...payload,p_explicit_consent:true
 }),"Duplicate share idempotency");
 denied(await b.from("dabberna_shared_expenses_v1").insert({
  household_id:household,created_by:idB,source_fingerprint:randomBytes(32).toString("hex"),
  category:"TEST",amount_fils:500,occurred_on:today
 }),"Direct expense table INSERT");
 const shared=ok(await a.from("dabberna_shared_expenses_v1")
  .select("id,created_by,category,amount_fils").eq("household_id",household),
  "Owner reads consented shared rows");
 assert.equal(shared.length,1);assert.equal(shared[0].created_by,idB);
 checkNoRows(await c.from("dabberna_shared_expenses_v1").select("id")
  .eq("household_id",household),"Unrelated user shared expenses");
 denied(await a.rpc("dabberna_unshare_one_expense",{
  p_household_id:household,p_expense_id:expense
 }),"Owner cannot withdraw another adult's item");
 console.log("Adult expense consent, author-only withdrawal and cross-tenant isolation pass");

 // One per-user vault; server holds only an encrypted envelope, never plaintext.
 const envelope={
  version:1,algorithm:"AES-256-GCM",kdf:"PBKDF2-SHA256",iterations:310000,
  salt:randomBytes(16).toString("base64"),iv:randomBytes(12).toString("base64"),
  ciphertext:randomBytes(64).toString("base64")
 };
 const revision=ok(await a.rpc("dabberna_put_private_vault",{
  p_expected_revision:0,p_envelope:envelope
 }),"Create A's personal encrypted vault");
 assert.equal(revision,1);
 denied(await a.rpc("dabberna_put_private_vault",{
  p_expected_revision:0,p_envelope:envelope
 }),"Stale revision clobber");
 checkNoRows(await b.from("dabberna_private_vault_v1").select("user_id")
  .eq("user_id",idA),"B cannot inspect A's private encrypted vault");
 denied(await b.from("dabberna_private_vault_v1").update({revision:123})
  .eq("user_id",idA),"Non-owner direct vault UPDATE");
 ok(await b.rpc("dabberna_delete_private_vault"),"B delete own empty vault");
 const stillThere=ok(await a.from("dabberna_private_vault_v1")
  .select("revision").eq("user_id",idA).maybeSingle(),
  "B deletion does not alter A vault");
 assert.equal(stillThere.revision,1);
 ok(await a.rpc("dabberna_delete_private_vault"),"A deletes own vault");
 checkNoRows(await a.from("dabberna_private_vault_v1").select("user_id")
  .eq("user_id",idA),"Owner vault deletion");
 console.log("User-owned encrypted vault, revision conflicts and delete boundaries pass");

 // Final: B's server-shared financial rows MUST vanish on owner revocation.
 ok(await a.rpc("dabberna_revoke_adult",{
  p_household_id:household,p_user_id:idB
 }),"Owner revokes co-parent");
 checkNoRows(await a.from("dabberna_shared_expenses_v1").select("id")
  .eq("household_id",household),"Revocation purges former adult's posts");
 checkNoRows(await b.from("dabberna_shared_expenses_v1").select("id")
  .eq("household_id",household),"Revoked co-parent read denied");
 denied(await b.rpc("dabberna_share_one_expense",{
  ...payload,p_source_fingerprint:randomBytes(32).toString("hex"),
  p_explicit_consent:true
 }),"Revoked co-parent cannot share again");
 console.log("All required tenant isolation checks passed. Staging household fixture remains for audit.");
}
try{await run();}
catch(error){
 console.error("FAIL: "+(error instanceof Error?error.message:String(error)));
 process.exitCode=1;
}finally{
 await Promise.allSettled([
  a.auth.signOut(),b.auth.signOut(),c.auth.signOut()
 ]);
}
