import {describe,expect,it} from "vitest";
import {detectSensitiveAiText,containsSensitiveAiContent} from "./liveAiPrivacy";
import {parseLiveAiRequest} from "./liveAiProtocol";

const req=(question:string,history:unknown[]=[])=>
 ({question,language:"en",history});
describe("live family AI sensitive data guards",()=>{
 it("rejects contact details, known national phone forms, secrets and banking references",()=>{
  const inputs=[
   "Contact me at someone@example.com",
   "My phone number is +962791234567",
   "Call 0791234567 about the appointment",
   "API key is sk-1234567890ABCDEFGHIJKLMNOP",
   "Use Bearer abcdefghijklmnopqrstuvwxyz09876",
   "My IBAN is JO94CBJO0010000000000131000302",
   "Account number: 123456789012",
   "Charge 4111 1111 1111 1111 for school supplies",
   "Your card is 5555-5555-5555-4444"
  ];
  for(const question of inputs){
   expect(containsSensitiveAiContent(question),question).toBe(true);
   expect(()=>parseLiveAiRequest(req(question)),question).toThrow(/Remove sensitive details/);
  }
 });
 it("does not block typical parent budgeting and family questions or short amounts",()=>{
  for(const question of [
   "We earn 2000 JOD per month and have expenses of 1350 JOD. Any tips?",
   "My kids are 3 and 5; plan a weekend outing under 30 dinars.",
   "What if our salary is delayed for 15 days?",
   "Estimate a school shopping budget for October 2026."
  ]){
   expect(detectSensitiveAiText(question)).toBeNull();
   expect(parseLiveAiRequest(req(question)).question).toBe(question);
  }
 });
 it("refuses sensitive content hidden in older assistant or user turns",()=>{
  expect(()=>parseLiveAiRequest(req("Please summarize our discussion",[
   {role:"assistant",content:"Previous user email: parent@example.org"}
  ]))).toThrow(/Remove sensitive details/);
  expect(()=>parseLiveAiRequest(req("Please suggest family activities",[
   {role:"user",content:"The family card is 4111111111111111"}
  ]))).toThrow();
 });
 it("never echoes secrets or matched details into generated validation errors",()=>{
  const secret="parent@example.com";
  const kind=detectSensitiveAiText(secret);
  expect(kind).toBe("email");
  let message="";
  try{parseLiveAiRequest(req(secret));}catch(e){message=String(e);}
  expect(message).not.toContain(secret);
 });
 it("does not mistake innocuous quantities for a payment card",()=>{
  expect(detectSensitiveAiText("We have 12 shopping items with 30 JOD saved.")).toBeNull();
  expect(detectSensitiveAiText("Budget: 1000 2000 3000 4000 JOD")).toBeNull();
 });
});
