import {describe,expect,it} from "vitest";
import {webcrypto} from "node:crypto";
import {encryptPrivateBackup,decryptPrivateBackup,
 preparePrivateVaultSnapshot,validVaultEnvelope} from "./privateVaultCrypto";
import {sampleMoney,sampleMembers} from "./money";
import {defaultFamilyPreferences} from "./familyPreferences";
import {inspectLocalBackup} from "./backupRestore";
import {isPersonalVaultRow} from "./privateVaultApi";

const crypto=webcrypto as unknown as Crypto;
const password="a-long-personal-vault-passphrase-2026";
function storage(){
 const m=new Map<string,string>();
 return {
  get length(){return m.size;},
  key(i:number){return [...m.keys()][i]??null;},
  getItem(k:string){return m.get(k)??null;},
  setItem(k:string,v:string){m.set(k,v);}
 };
}
describe("user-passphrase encrypted private vault",()=>{
 it("encrypts then decrypts only with the correct passphrase and hides plaintext",async()=>{
  const plain='{"app":"dabberna","message":"Private financial record 12345"}';
  const encrypted=await encryptPrivateBackup(plain,password,crypto);
  expect(validVaultEnvelope(encrypted)).toBe(true);
  expect(JSON.stringify(encrypted)).not.toContain("Private financial record");
  expect(JSON.stringify(encrypted)).not.toContain(password);
  expect(await decryptPrivateBackup(encrypted,password,crypto)).toBe(plain);
  await expect(decryptPrivateBackup(encrypted,"somebody-else-wrong-2026",crypto))
    .rejects.toThrow(/Cannot decrypt/i);
 });
 it("uses independent salt and nonce for every encryption",async()=>{
  const a=await encryptPrivateBackup('{"amount":500}',password,crypto);
  const b=await encryptPrivateBackup('{"amount":500}',password,crypto);
  expect(a.salt).not.toBe(b.salt);
  expect(a.iv).not.toBe(b.iv);
  expect(a.ciphertext).not.toBe(b.ciphertext);
 });
 it("refuses weak passphrases, mismatched parameters and tampered ciphertext",async()=>{
  await expect(encryptPrivateBackup("{}", "too-short",crypto)).rejects.toThrow(/passphrase/i);
  const envelope=await encryptPrivateBackup('{"safe":true}',password,crypto);
  expect(validVaultEnvelope({...envelope,iterations:10})).toBe(false);
  expect(validVaultEnvelope({...envelope,algorithm:"none"})).toBe(false);
  const broken={...envelope,ciphertext:envelope.ciphertext.slice(0,-4)+"AAAA"};
  await expect(decryptPrivateBackup(broken,password,crypto)).rejects.toThrow(/Cannot decrypt/i);
 });
 it("requires opt-in per core section and NEVER copies saved outing credentials",()=>{
  const s=storage();
  s.setItem("wafferli.v13.money",JSON.stringify(sampleMoney()));
  s.setItem("wafferli.v13.members",JSON.stringify(sampleMembers()));
  s.setItem("wafferli.v13.familyPreferences",JSON.stringify(defaultFamilyPreferences));
  s.setItem("wafferli.v13.outings",JSON.stringify([{admin_token:"TOP_SECRET_ADMIN",vote_token:"SENSITIVE_VOTE"}]));
  s.setItem("sb-community-auth-token",JSON.stringify({access_token:"SECRET_AUTH"}));
  expect(()=>preparePrivateVaultSnapshot(s,[])).toThrow(/Select/i);
  const snapshot=preparePrivateVaultSnapshot(s,["money"],new Date("2026-10-15T12:00:00Z"));
  expect(snapshot.sections).toEqual(["money"]);
  const payload=JSON.parse(snapshot.json) as {entries:Record<string,unknown>};
  expect(Object.keys(payload.entries)).toEqual(["money"]);
  expect(snapshot.json).not.toContain("TOP_SECRET_ADMIN");
  expect(snapshot.json).not.toContain("SECRET_AUTH");
  expect(snapshot.json).not.toContain("Me (sample)");
  expect(inspectLocalBackup(snapshot.json,s).sections.map(x=>x.key)).toEqual(["money"]);
  expect(()=>preparePrivateVaultSnapshot(s,["shopping"])).toThrow(/Select/i);
 });
 it("rejects forged server ownership and invalid encrypted records",async()=>{
  const envelope=await encryptPrivateBackup('{"test":1}',password,crypto);
  const record={
   user_id:"4b15c7df-5010-4fe5-862a-4a4c8407941f",
   revision:1,envelope,updated_at:"2026-10-15T12:00:00Z"
  };
  expect(isPersonalVaultRow(record)).toBe(true);
  expect(isPersonalVaultRow({...record,user_id:"user-local"})).toBe(false);
  expect(isPersonalVaultRow({...record,revision:-1})).toBe(false);
  expect(isPersonalVaultRow({...record,envelope:{...envelope,kdf:"none"}})).toBe(false);
 });
});
