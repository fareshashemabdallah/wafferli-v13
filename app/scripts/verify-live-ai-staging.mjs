/**
 * Dabberna Live AI staging smoke tests.
 * MANUAL, networked and isolated: never point at the public Supabase project.
 * Run with: npm run security:ai-staging (in app/)
 * No paid AI request unless DABBERNA_RUN_PAID_AI_TEST=I_ACCEPT_PROVIDER_COST.
 * No raw question, token, password, or model response is printed.
 */
import assert from "node:assert/strict";
import {createClient} from "@supabase/supabase-js";

const e=process.env;
function requireEnv(k){
 const v=e[k];
 if(!v)throw Error("Missing staging setting: "+k);
 return v;
}
function guardStaging(){
 assert.equal(requireEnv("DABBERNA_CONFIRM_STAGING"),"DISPOSABLE_PROJECT_ONLY",
  "Only a designated disposable staging project is permitted");
 const ref=requireEnv("DABBERNA_STAGING_PROJECT_REF");
 assert.match(ref,/^[a-z0-9]{8,40}$/);
 assert.notEqual(ref,"izevfgdynsrlwgsczllr","Refusing the existing public Supabase project");
 const url=new URL(requireEnv("DABBERNA_STAGING_URL"));
 assert.equal(url.protocol,"https:");
 assert.equal(url.hostname,ref+".supabase.co");
 assert.equal(url.pathname,"/");
 assert.equal(url.search,"");
 assert.equal(url.username,"");
 assert.equal(url.password,"");
 return {url:url.origin,anon:requireEnv("DABBERNA_STAGING_ANON_KEY")};
}
const {url,anon}=guardStaging();
const functionUrl=url+"/functions/v1/dabberna-family-ai";
const origin=e["DABBERNA_AI_TEST_ORIGIN"]??"https://fareshashemabdallah.github.io";
const allowed=new URL(origin);
if(allowed.origin!==origin||allowed.protocol!=="https:"||allowed.username||allowed.password)
 throw Error("An exact HTTPS staging-allowed origin is required");
const headers={apikey:anon,Origin:origin,"Content-Type":"application/json"};
const question={question:"How should we plan a family activity with 30 JOD?",language:"en",history:[],parentConsent:true};

async function request(method,body,{token,requestOrigin=origin,contentType="application/json"}={}){
 const response=await fetch(functionUrl,{
  method,
  headers:{
   ...headers,Origin:requestOrigin,
   ...(contentType?{"Content-Type":contentType}:{}),
   ...(token?{Authorization:"Bearer "+token}:{})
  },
  ...(method==="POST"?{body:JSON.stringify(body)}:{})
 });
 let result=null;
 // The response body is intentionally not included in test logs.
 if(method!=="OPTIONS")try{result=await response.json();}catch{ /* errors may not be JSON */ }
 return {status:response.status,headers:response.headers,result};
}
async function main(){
 console.log("Checking isolated Dabberna AI staging endpoint (no user content in logs).");
 let result=await request("OPTIONS",null);
 assert.equal(result.status,204,"Allowed-origin CORS preflight failed");
 assert.equal(result.headers.get("access-control-allow-origin"),origin);

 result=await request("POST",question,{requestOrigin:"https://invalid-origin.example"});
 assert.equal(result.status,403,"Unapproved browser origin was not denied");

 result=await request("POST",question,{contentType:"text/plain"});
 assert.equal(result.status,415,"Non-JSON payload was not denied");

 result=await request("POST",question);
 if(result.status===503)throw Error("Staging server AI is disabled or unconfigured; apply quota SQL, set secrets, deploy Edge, then rerun");
 assert.equal(result.status,401,"Unauthenticated user must be denied");
 console.log("PASS: CORS, content type and unauthenticated request controls");

 // Auth tests and AI provider calls require designated disposable adult test user.
 const hasIdentity=Boolean(e["DABBERNA_AI_TEST_EMAIL"]&&e["DABBERNA_AI_TEST_PASSWORD"]);
 const paid=e["DABBERNA_RUN_PAID_AI_TEST"]==="I_ACCEPT_PROVIDER_COST";
 if(!hasIdentity){
  if(paid)throw Error("Paid staging test needs disposable email/password credentials");
  console.log("No disposable test sign-in supplied: authenticated protocol tests skipped.");
  return;
 }
 const db=createClient(url,anon,{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
 });
 const login=await db.auth.signInWithPassword({
  email:requireEnv("DABBERNA_AI_TEST_EMAIL"),
  password:requireEnv("DABBERNA_AI_TEST_PASSWORD")
 });
 if(login.error||!login.data.session?.access_token)throw Error("Disposable staging sign-in failed");
 const token=login.data.session.access_token;
 try{
  // All these must be rejected BEFORE the AI quota is claimed or a provider is queried.
  for(const body of [
   {...question,parentConsent:false},
   {...question,children:[{name:"FAKE_CHILD"}]},
   {...question,question:"Email synthetic@example.com with the answer"},
   {...question,history:[{role:"assistant",content:"Card 4111 1111 1111 1111"}]},
   {...question,context:{secretToken:"FAKE"}}
  ]){
   const blocked=await request("POST",body,{token});
   assert.equal(blocked.status,400,"Malformed/sensitive authenticated request was not rejected");
  }
  console.log("PASS: authenticated request parser blocks hidden fields and synthetic sensitive text");
  if(!paid){
   console.log("No provider request made. Set DABBERNA_RUN_PAID_AI_TEST=I_ACCEPT_PROVIDER_COST for a single billable test.");
   return;
  }
  const answer=await request("POST",question,{token});
  assert.equal(answer.status,200,"Single live-provider roundtrip failed (check backend server logs without user text)");
  assert.equal(typeof answer.result?.answer,"string");
  assert.ok(answer.result.answer.length>5&&answer.result.answer.length<=4200);
  console.log("PASS: authenticated staged OpenAI answer returned. Response content deliberately not printed.");
 }finally{
  await db.auth.signOut();
 }
}
main().catch(error=>{
 console.error("AI staging verification FAILED: "+(error instanceof Error?error.message:"Unknown error"));
 process.exitCode=1;
});
