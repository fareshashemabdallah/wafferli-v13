import {describe,expect,it} from "vitest";
import {webcrypto} from "node:crypto";
import {buildLocalBackup} from "./localDataControls";
import {decryptPrivateBackup,encryptPrivateBackup,preparePrivateVaultSnapshot,validVaultEnvelope} from "./privateVaultCrypto";
import {inspectLocalBackup,restoreLocalSections} from "./backupRestore";
import {sampleMoney} from "./money";
const crypto=webcrypto as unknown as Crypto;
const password="a-fairly-long-family-backup-passphrase";
const makeStorage=()=>{
 const m=new Map<string,string>();
 return {get length(){return m.size;},key:(i:number)=>[...m.keys()][i]??null,
  getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);},
  removeItem:(k:string)=>{m.delete(k);}
 };
};
describe("private encrypted offline backup round trip",()=>{
 it("encrypts only vetted backup categories; restore still requires explicit consent",async()=>{
  const original=makeStorage(),target=makeStorage();
  original.setItem("wafferli.v13.money",JSON.stringify(sampleMoney()));
  original.setItem("wafferli.v13.outings",'[{"admin_token":"SECRET_ORGANIZER"}]');
  const keys=inspectLocalBackup(JSON.stringify(buildLocalBackup(original)),original)
   .sections.map(s=>s.key);
  const snapshot=preparePrivateVaultSnapshot(original,keys);
  expect(snapshot.json).not.toContain("SECRET_ORGANIZER");
  const ciphertext=await encryptPrivateBackup(snapshot.json,password,crypto);
  expect(validVaultEnvelope(ciphertext)).toBe(true);
  expect(JSON.stringify(ciphertext)).not.toContain('"income":1200');
  await expect(decryptPrivateBackup(ciphertext,"wrong-password-for-test",crypto)).rejects.toThrow();
  const recovered=await decryptPrivateBackup(ciphertext,password,crypto);
  const preview=inspectLocalBackup(recovered,target);
  expect(preview.sections.map(s=>s.key)).toEqual(["money"]);
  expect(()=>restoreLocalSections(target,preview,["money"],false)).toThrow();
  restoreLocalSections(target,preview,["money"],true);
  expect(JSON.parse(target.getItem("wafferli.v13.money")!).income).toBe(1200);
  expect(target.getItem("wafferli.v13.outings")).toBeNull();
 });
});
