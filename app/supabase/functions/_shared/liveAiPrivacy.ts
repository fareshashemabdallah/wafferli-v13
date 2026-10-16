/** Privacy guardrails shared by the Dabberna browser and Supabase Edge.
 * Detection is a conservative safeguard, NOT a guarantee that personally
 * identifying details have been removed. Raw text is never logged here.
 */
export type SensitiveAiKind="email"|"phone"|"financial-id"|"credential"|"payment-card";
const patterns:{
 kind:SensitiveAiKind;regex:RegExp
}[]=[
 {kind:"email",regex:/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i},
 {kind:"credential",regex:/(?:\bsk-[A-Za-z0-9_-]{16,}|\bsb_secret_[A-Za-z0-9_-]{12,}|\bBearer\s+[A-Za-z0-9._~+/-]{20,}|\beyJ[A-Za-z0-9._~-]{35,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/i},
 {kind:"financial-id",regex:/(?:\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b|\b(?:IBAN|SWIFT|account(?:\s+number)?|routing(?:\s+number)?|رقم\s*(?:الحساب|الآيبان)|ايبان|آيبان)\s*[:#-]?\s*[A-Z0-9][A-Z0-9 -]{8,})/i},
 {kind:"phone",regex:/(?:\+962|00962|0)7[789][\s.-]?\d{3}[\s.-]?\d{4}|\+\d[\d\s().-]{8,18}\d/i}
];
function passesLuhn(digits:string){
 let total=0,double=false;
 for(let i=digits.length-1;i>=0;i--){
  let digit=digits.charCodeAt(i)-48;
  if(double){digit*=2;if(digit>9)digit-=9;}
  total+=digit;double=!double;
 }
 return total%10===0;
}
function containsCardLike(text:string){
 const matches=text.match(/(?:^|[^\d])(?:\d[ -]?){12,18}\d(?=$|[^\d])/g)??[];
 return matches.some(candidate=>{
  const digits=candidate.replace(/\D/g,"");
  return digits.length>=13&&digits.length<=19&&passesLuhn(digits);
 });
}
/** Return only a category, NEVER a sensitive matching substring. Users must
 * edit the draft themselves rather than secretly auto-removing numbers.
 */
export function detectSensitiveAiText(text:string):SensitiveAiKind|null{
 for(const {kind,regex} of patterns)if(regex.test(text))return kind;
 return containsCardLike(text)?"payment-card":null;
}
export function containsSensitiveAiContent(text:string):boolean{
 return detectSensitiveAiText(text)!==null;
}
