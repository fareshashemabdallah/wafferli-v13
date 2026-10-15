import {buildLocalBackup} from "./localDataControls";
import {inspectLocalBackup,type RestorableKey} from "./backupRestore";

/** Encrypted, personal-only snapshot. No co-parent / household record access is
 * implied by the authenticated user ID. The passphrase never leaves this tab.
 */
export type EncryptedVaultEnvelope={
 version:1;
 algorithm:"AES-256-GCM";
 kdf:"PBKDF2-SHA256";
 iterations:310000;
 salt:string;
 iv:string;
 ciphertext:string;
};
const ITERATIONS=310000;
const MIN_PASSPHRASE=14;
const MAX_BACKUP_BYTES=5_000_000;
const MAX_CIPHERTEXT_CHARS=8_000_000;
const encoder=new TextEncoder();
const decoder=new TextDecoder("utf-8",{fatal:true});
const b64=(array:Uint8Array)=>{
 let binary="";
 for(let i=0;i<array.length;i+=8192)
  binary+=String.fromCharCode(...array.subarray(i,i+8192));
 return btoa(binary);
};
const un64=(value:string)=>{
 if(!/^[A-Za-z0-9+/]*={0,2}$/.test(value)||value.length%4!==0)
  throw new Error("Invalid encrypted-vault encoding");
 let raw:string;
 try{raw=atob(value);}catch{throw new Error("Invalid encrypted-vault encoding");}
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
};
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
export function validVaultEnvelope(input:unknown):input is EncryptedVaultEnvelope{
 if(!record(input))return false;
 if(input["version"]!==1||input["algorithm"]!=="AES-256-GCM"||
    input["kdf"]!=="PBKDF2-SHA256"||input["iterations"]!==ITERATIONS)return false;
 const salt=input["salt"],iv=input["iv"],data=input["ciphertext"];
 if(typeof salt!=="string"||typeof iv!=="string"||typeof data!=="string"||
    data.length<28||data.length>MAX_CIPHERTEXT_CHARS)return false;
 try{return un64(salt).length===16&&un64(iv).length===12&&un64(data).length>=16;}
 catch{return false;}
}
async function derive(passphrase:string,salt:Uint8Array,cryptoProvider:Crypto):Promise<CryptoKey>{
 const material=await cryptoProvider.subtle.importKey("raw",encoder.encode(passphrase),
  "PBKDF2",false,["deriveKey"]);
 return cryptoProvider.subtle.deriveKey({name:"PBKDF2",salt,
  iterations:ITERATIONS,hash:"SHA-256"},material,
  {name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
export async function encryptPrivateBackup(
 plaintext:string,passphrase:string,cryptoProvider:Crypto=globalThis.crypto
):Promise<EncryptedVaultEnvelope>{
 if(!cryptoProvider?.subtle||!cryptoProvider?.getRandomValues)
  throw new Error("Encrypted storage requires a secure browser");
 if(passphrase.length<MIN_PASSPHRASE||passphrase.length>200)
  throw new Error("Use a passphrase between 14 and 200 characters");
 if(!plaintext||encoder.encode(plaintext).byteLength>MAX_BACKUP_BYTES)
  throw new Error("Backup exceeds the private-vault limit");
 const salt=cryptoProvider.getRandomValues(new Uint8Array(16));
 const iv=cryptoProvider.getRandomValues(new Uint8Array(12));
 const key=await derive(passphrase,salt,cryptoProvider);
 const encrypted=await cryptoProvider.subtle.encrypt(
  {name:"AES-GCM",iv},key,encoder.encode(plaintext));
 return {
  version:1,algorithm:"AES-256-GCM",kdf:"PBKDF2-SHA256",
  iterations:ITERATIONS,salt:b64(salt),iv:b64(iv),
  ciphertext:b64(new Uint8Array(encrypted))
 };
}
/** Authentication by AES-GCM catches an incorrect passphrase or tampered
 * ciphertext. Decryption alone does NOT validate the restored JSON schema;
 * the caller must still inspectLocalBackup before importing anything.
 */
export async function decryptPrivateBackup(
 envelope:unknown,passphrase:string,cryptoProvider:Crypto=globalThis.crypto
):Promise<string>{
 if(!validVaultEnvelope(envelope))throw new Error("Unsupported or corrupt encrypted backup");
 if(!cryptoProvider?.subtle)throw new Error("A secure browser is required");
 if(passphrase.length<MIN_PASSPHRASE||passphrase.length>200)
  throw new Error("Enter the passphrase used when creating this vault");
 const salt=un64(envelope.salt),iv=un64(envelope.iv),bytes=un64(envelope.ciphertext);
 try{
  const key=await derive(passphrase,salt,cryptoProvider);
  const plain=await cryptoProvider.subtle.decrypt({name:"AES-GCM",iv},key,bytes);
  if(plain.byteLength>MAX_BACKUP_BYTES)throw new Error("Vault content is too large");
  return decoder.decode(plain);
 }catch{throw new Error("Cannot decrypt vault. Check your passphrase or the file's integrity.");}
}
/** Strip all token-bearing/unreviewed local modules before an opt-in upload.
 * Contains only sections that the current validated restore can rehydrate.
 */
export function preparePrivateVaultSnapshot(
 storage:Pick<Storage,"length"|"key"|"getItem">,now=new Date()
):{json:string;sections:RestorableKey[]}{
 const full=buildLocalBackup(storage,now);
 const preview=inspectLocalBackup(JSON.stringify(full),storage);
 const entries:Record<string,unknown>={};
 const sections:RestorableKey[]=[];
 for(const item of preview.sections){
  entries[item.key]=JSON.parse(preview.values[item.key]!) as unknown;
  sections.push(item.key);
 }
 const json=JSON.stringify({...full,entries,
  warning:"Encrypted personal vault; only reviewed core sections, no cloud household sharing."});
 if(encoder.encode(json).byteLength>MAX_BACKUP_BYTES)throw new Error("Vault snapshot exceeds 5 MB");
 return {json,sections};
}
