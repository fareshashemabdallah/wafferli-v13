import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const root=(path:string)=>readFileSync(new URL(path,import.meta.url),"utf8");
describe("live AI deployment security invariants",()=>{
 const edge=root("../../supabase/functions/dabberna-family-ai/index.ts");
 const quota=root("../../supabase/ai_quota_v1.sql");
 const ui=root("../components/LiveFamilyAdvisor.tsx");
 const workflow=root("../../../.github/workflows/dabberna-deploy.yml");
 it("never exposes OpenAI credentials from browser or sends unconsented local context",()=>{
  expect(ui).not.toContain("OPENAI_API_KEY");
  expect(ui).toContain("checked={consent}");
  expect(ui).toContain("checked={shareNumbers}");
  expect(ui).toContain("shareNumbers&&summary");
  expect(ui).not.toContain("JSON.stringify(money)");
  expect(edge).toContain('Deno.env.get("OPENAI_API_KEY")');
  expect(edge).toContain('"https://api.openai.com/v1/responses"');
  expect(edge).toContain("store:false");
 });
 it("requires verified user and a database rate claim before hitting AI API",()=>{
  const auth=edge.indexOf("db.auth.getUser(token)");
  const claim=edge.indexOf('db.rpc("dabberna_ai_claim_turn")');
  const outbound=edge.indexOf('fetch("https://api.openai.com/v1/responses"');
  expect(auth).toBeGreaterThan(0);
  expect(claim).toBeGreaterThan(auth);
  expect(outbound).toBeGreaterThan(claim);
  expect(edge).toContain('DABBERNA_AI_SERVER_ENABLED');
  expect(edge).toContain('AI_ALLOWED_ORIGINS');
  expect(edge).toContain('parseLiveAiRequest(JSON.parse(content))');
  expect(edge).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
 });
 it("stores only request counters and denies table access to anonymous and authenticated callers",()=>{
  expect(quota).toContain("enable row level security");
  expect(quota).toContain("revoke all on public.dabberna_ai_usage_v1 from public, anon, authenticated");
  expect(quota).toContain("grant execute on function public.dabberna_ai_claim_turn() to authenticated");
  expect(quota).toContain("auth.uid()");
  expect(quota).toContain("old.used<20");
  expect(quota).toContain("old.used<4");
  expect(quota).toContain("AI_RATE_LIMIT");
  expect(quota).not.toContain("prompt text");
 });
 it("cannot turn on the public UI accidentally with an OpenAI secret",()=>{
  expect(workflow).toContain("vars.DABBERNA_ENABLE_LIVE_AI");
  expect(workflow).toContain("VITE_ENABLE_LIVE_AI");
  expect(workflow).not.toContain("OPENAI_API_KEY");
 });
});
