import {describe,expect,it} from "vitest";
import {compareOutingOptions,newOutingOption,type OutingOption,type OutingConstraints} from "./childAwareOutingCompare";
import {inspectLocalBackup,restoreLocalSections} from "./backupRestore";
import {buildLocalBackup} from "./localDataControls";
const now=new Date(2026,9,15,12);
const example:OutingOption={id:"a",name:"Children's play centre",kind:"indoor",checkedOn:"2026-10-15",
 totalEstimatedJod:40,distanceKm:5,childAdmission:"yes",ageFit:"yes",accessible:"yes",noise:"quiet"};
const constraints:OutingConstraints={children:"yes",ages:["3-5"],requireStroller:true,
 preferQuiet:true,weather:"clear",budgetJod:60,maxDistanceKm:10};
const storage=()=>{const db=new Map<string,string>();return{
 get length(){return db.size;},key:(i:number)=>[...db.keys()][i]??null,
 getItem:(k:string)=>db.get(k)??null,
 setItem:(k:string,v:string)=>{db.set(k,v);},
 removeItem:(k:string)=>{db.delete(k);}
}};
describe("child-aware outing decision guardrails",()=>{
 it("is only provisional even when parent has confirmed all relevant fields",()=>{
  const result=compareOutingOptions([example],constraints,now)[0]!;
  expect(result.suitability).toBe("provisional");
  expect(result.reasonsEn.join(" ")).toMatch(/still need checking/);
  expect(result.costWithinBudget).toBe(true);
 });
 it("never recommends a venue marked no child admission or wrong age range",()=>{
  const result=compareOutingOptions([{...example,childAdmission:"no",ageFit:"no"}],constraints,now)[0]!;
  expect(result.suitability).toBe("not-suitable");
  expect(result.reasonsEn.join(" ")).toContain("does not admit children");
 });
 it("warns about rain for outdoor venues, and avoids invented weather checks",()=>{
  const unknown=compareOutingOptions([{...example,kind:"outdoor"}],
   {...constraints,weather:"unknown"},now)[0]!;
  expect(unknown.suitability).toBe("needs-confirmation");
  expect(unknown.reasonsEn.join(" ")).toContain("actual weather");
  const rain=compareOutingOptions([{...example,kind:"outdoor"}],
   {...constraints,weather:"rain"},now)[0]!;
  expect(rain.reasonsEn.join(" ")).toContain("Rain was selected by you");
 });
 it("checks whole-family expense and stroller requirements rather than false savings",()=>{
  const result=compareOutingOptions([{...example,totalEstimatedJod:90,accessible:"no"}],
   constraints,now)[0]!;
  expect(result.suitability).toBe("not-suitable");
  expect(result.costWithinBudget).toBe(false);
 });
 it("refuses malicious or invalid stored records",()=>{
  expect(()=>newOutingOption({...example,checkedOn:"2026-02-31"},now)).toThrow();
  expect(()=>newOutingOption({...example,totalEstimatedJod:-10},now)).toThrow();
  expect(()=>newOutingOption({...example,name:"x"},now)).toThrow();
 });
 it("supports selective local backup, rejects hidden authorization fields",()=>{
  const source=storage(),destination=storage();
  source.setItem("wafferli.v13.privateOutingOptions",JSON.stringify([example]));
  source.setItem("sb-local-auth-token","secret");
  const file=JSON.stringify(buildLocalBackup(source,now));
  const preview=inspectLocalBackup(file,destination);
  expect(preview.sections.map(x=>x.key)).toEqual(["privateOutingOptions"]);
  expect(file).not.toContain("secret");
  restoreLocalSections(destination,preview,["privateOutingOptions"],true);
  expect(JSON.parse(destination.getItem("wafferli.v13.privateOutingOptions")!)).toEqual([example]);
  const bad=JSON.parse(file) as {entries:Record<string,unknown>};
  bad.entries["privateOutingOptions"]=[{...example,access_token:"secret"}];
  expect(()=>inspectLocalBackup(JSON.stringify(bad),storage())).toThrow(/invalid privateOutingOptions/i);
 });
});
