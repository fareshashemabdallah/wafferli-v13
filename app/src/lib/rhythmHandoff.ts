/** A navigation hint is not a second record or a new family event.
 * The ONLY value carried for Calendar is an exact ISO date, and it is
 * consumed once in the same browser tab.
 */
export const CALENDAR_FOCUS_SESSION_KEY="dabberna:calendar:focus";
function validDate(date:string):boolean{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const [y,m,d]=date.split("-").map(Number);
 const parsed=new Date(y!,m!-1,d!,12);
 if(parsed.getFullYear()!==y||parsed.getMonth()+1!==m||parsed.getDate()!==d)return false;
 return true;
}
export function rememberCalendarDate(date:string):boolean{
 if(!validDate(date)||typeof window==="undefined")return false;
 try{window.sessionStorage.setItem(CALENDAR_FOCUS_SESSION_KEY,date);return true;}catch{return false;}
}
export function takeCalendarDate():string|undefined{
 if(typeof window==="undefined")return undefined;
 try{
  const candidate=window.sessionStorage.getItem(CALENDAR_FOCUS_SESSION_KEY);
  window.sessionStorage.removeItem(CALENDAR_FOCUS_SESSION_KEY);
  return candidate&&validDate(candidate)?candidate:undefined;
 }catch{return undefined;}
}
/** Writes only an existing plan identifier; underlying plans remain canonical. */
export function focusSavedPlan(id:string,validIds:readonly string[],write:(id:string)=>boolean):boolean{
 return id.length>0&&validIds.includes(id)&&write(id);
}
