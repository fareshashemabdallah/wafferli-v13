import {describe,expect,it} from "vitest";
import {makeFamilyTask,setTaskComplete,taskSummary,taskAttention} from "./familyTasks";
import {buildFamilyAttention} from "./familyAttention";
import {sampleMoney,sampleMembers} from "./money";
import {defaultFamilyPreferences} from "./familyPreferences";
import {buildLocalBackup} from "./localDataControls";
import {inspectLocalBackup,restoreLocalSections} from "./backupRestore";
const now=new Date(2026,9,15,12);
const task=(dueDate:string,priority:"high"|"normal"|"low"="normal")=>
 makeFamilyTask({id:"test-task",title:"Pay school fee",dueDate,priority},now)!;
const store=()=>{const m=new Map<string,string>();return {
 get length(){return m.size;},key:(i:number)=>[...m.keys()][i]??null,
 getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);},
 removeItem:(k:string)=>{m.delete(k);}
};};
describe("parent-controlled family tasks",()=>{
 it("validates due date, title and priority; no synthetic account permissions",()=>{
  expect(makeFamilyTask({id:"a",title:"",dueDate:"2026-10-20",priority:"high"},now)).toBeNull();
  expect(makeFamilyTask({id:"a",title:"Do it",dueDate:"2026-02-31",priority:"high"},now)).toBeNull();
  expect(task("2026-10-20").status).toBe("open");
  expect(task("2026-10-20")).not.toHaveProperty("authenticatedMemberId");
 });
 it("counts due/overdue and completion without changing unrelated tasks",()=>{
  const before=[task("2026-10-12"),{...task("2026-10-20"),id:"next"}];
  const summary=taskSummary(before,now);
  expect(summary.overdue).toBe(1);
  expect(summary.dueSoon).toBe(1);
  const completed=setTaskComplete(before[0]!,true,now);
  expect(completed.status).toBe("done");
  expect(completed.completedAt).toBe(now.toISOString());
  expect(taskSummary([completed,before[1]!],now).overdue).toBe(0);
  expect(task("2026-10-12").status).toBe("open");
 });
 it("shows family task priority only when lifestyle guidance is enabled",()=>{
  const x=buildFamilyAttention({money:sampleMoney(),members:sampleMembers(),
   plans:[],moments:[],tasks:[task("2026-10-12")],preferences:defaultFamilyPreferences,
   preferencesConfirmed:true,now});
  expect(x.some(item=>item.category==="task")).toBe(true);
  const silenced=buildFamilyAttention({money:sampleMoney(),members:sampleMembers(),
   plans:[],moments:[],tasks:[task("2026-10-12")],
   preferences:{...defaultFamilyPreferences,lifestyle:false},preferencesConfirmed:true,now});
  expect(silenced.some(item=>item.category==="task")).toBe(false);
 });
 it("supports opt-in local JSON recovery, refusing unknown account tokens",()=>{
  const src=store(),dst=store();src.setItem("wafferli.v13.familyTasks",JSON.stringify([task("2026-10-20")]));
  const file=JSON.stringify(buildLocalBackup(src,now));
  const preview=inspectLocalBackup(file,dst);
  expect(preview.sections.map(x=>x.key)).toContain("familyTasks");
  expect(()=>restoreLocalSections(dst,preview,["familyTasks"],false)).toThrow();
  restoreLocalSections(dst,preview,["familyTasks"],true);
  expect(JSON.parse(dst.getItem("wafferli.v13.familyTasks")!)).toHaveLength(1);
  const tampered=JSON.parse(file) as {entries:Record<string,unknown>};
  tampered.entries["familyTasks"]=[{...task("2026-10-20"),serverAuthToken:"secret"}];
  expect(()=>inspectLocalBackup(JSON.stringify(tampered),store())).toThrow(/invalid familyTasks/i);
 });
});
