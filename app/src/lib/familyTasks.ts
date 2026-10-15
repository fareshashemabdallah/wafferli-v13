import {dateKey,parseCalendarDate,shiftDays} from "./familyCalendar";
export const FAMILY_TASKS_KEY="familyTasks";
export type FamilyTask={
 id:string;title:string;dueDate:string;createdAt:string;updatedAt:string;
 priority:"high"|"normal"|"low";status:"open"|"done";
 ownerMemberId?:string;planId?:string;note?:string;completedAt?:string;
};
const clean=(v:string,n:number)=>v.trim().replace(/[\u0000-\u001f\u007f]/g," ")
 .replace(/\s+/g," ").slice(0,n).trim();
export function makeFamilyTask(input:{
 id:string;title:string;dueDate:string;priority:FamilyTask["priority"];
 ownerMemberId?:string;planId?:string;note?:string
},now=new Date()):FamilyTask|null{
 const title=clean(input.title,140);
 if(!title||!input.id||input.id.length>130||!parseCalendarDate(input.dueDate)||
  !["high","normal","low"].includes(input.priority))return null;
 const created=now.toISOString();
 return {id:input.id,title,dueDate:input.dueDate,
  priority:input.priority,status:"open",createdAt:created,updatedAt:created,
  ...(input.ownerMemberId?{ownerMemberId:clean(input.ownerMemberId,130)}:{}),
  ...(input.planId?{planId:clean(input.planId,130)}:{}),
  ...(input.note?.trim()?{note:clean(input.note,300)}:{})};
}
export function setTaskComplete(task:FamilyTask,done:boolean,now=new Date()):FamilyTask{
 if((task.status==="done")===done)return task;
 const {completedAt:_previousCompletion,...base}=task;
 return {...base,status:done?"done":"open",updatedAt:now.toISOString(),
  ...(done?{completedAt:now.toISOString()}:{})};
}
export type TaskSummary={open:number;overdue:number;dueSoon:number;completed:number;next:FamilyTask[]};
export function taskSummary(tasks:readonly FamilyTask[],now=new Date()):TaskSummary{
 const today=dateKey(now),seven=dateKey(shiftDays(now,7));
 const open=tasks.filter(t=>t.status==="open"&&!!parseCalendarDate(t.dueDate));
 const next=[...open].sort((a,b)=>
  Number(a.dueDate>=today)-Number(b.dueDate>=today)===0?
   a.dueDate.localeCompare(b.dueDate)||({high:0,normal:1,low:2}[a.priority]-{high:0,normal:1,low:2}[b.priority]):
   a.dueDate.localeCompare(b.dueDate)
 ).slice(0,12);
 return {open:open.length,overdue:open.filter(t=>t.dueDate<today).length,
  dueSoon:open.filter(t=>t.dueDate>=today&&t.dueDate<=seven).length,
  completed:tasks.filter(t=>t.status==="done").length,next};
}
/** Time-based family tasks are reminders only and cannot reserve, pay, or
 * delegate work outside this device. Member IDs are local display labels.
 */
export function taskAttention(tasks:readonly FamilyTask[],now=new Date()):{
 id:string;title:string;date:string;urgent:boolean;count:number
}|null{
 const summary=taskSummary(tasks,now);
 const first=summary.next[0];
 if(!first||(!summary.overdue&&!summary.dueSoon))return null;
 const overdue=summary.overdue>0;
 return {id:first.id,title:first.title,date:first.dueDate,urgent:overdue||first.priority==="high",
  count:overdue?summary.overdue:summary.dueSoon};
}
