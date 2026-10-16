import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
/** Contract assertions, NOT execution against a Supabase project. */
const source=readFileSync("scripts/verify-live-ai-staging.mjs","utf8");
describe("manual live AI staging verification cannot silently target public data",()=>{
 it("requires an explicit disposable project and rejects the public production reference",()=>{
  expect(source).toContain("DABBERNA_CONFIRM_STAGING");
  expect(source).toContain("DISPOSABLE_PROJECT_ONLY");
  expect(source).toContain('assert.notEqual(ref,"izevfgdynsrlwgsczllr"');
  expect(source).toContain('ref+".supabase.co"');
 });
 it("separates non-billable negative checks from an opt-in paid OpenAI call",()=>{
  expect(source).toContain("I_ACCEPT_PROVIDER_COST");
  expect(source).toContain('if(!paid){');
  expect(source.indexOf('if(!paid){')).toBeLessThan(source.indexOf('const answer=await request("POST",question,{token});'));
  expect(source).toContain("assert.equal(blocked.status,400");
  expect(source).toContain("assert.equal(result.status,403");
  expect(source).toContain("assert.equal(result.status,401");
  expect(source).not.toContain("OPENAI_API_KEY");
 });
 it("never logs model answers, user passwords, auth tokens or prompt contents",()=>{
  expect(source).toContain('typeof answer.result?.answer,"string"');
  expect(source).not.toContain("console.log(answer)");
  expect(source).not.toContain("console.log(token)");
  expect(source).not.toContain("console.log(question)");
  expect(source).not.toContain("console.log(login)");
 });
});
