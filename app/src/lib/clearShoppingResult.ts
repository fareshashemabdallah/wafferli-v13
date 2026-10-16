/** Parent-entered offers only. A cost difference is not a verified saving. */
export type ManualPriceOption={id:string;store:string;price:string;extra:string};
export type ManualComparison={
 ready:boolean;
 validOptions:number;
 cheaper:ManualPriceOption|null;
 runnerUp:ManualPriceOption|null;
 cheapestTotalJod:number|null;
 alternativeTotalJod:number|null;
 differenceJod:number|null;
 tied:boolean
};
function amount(input:string,optional=false):number|null{
 const text=input.trim();
 if(optional&&text==="")return 0;
 if(!/^\d{1,6}(?:\.\d{1,2})?$/.test(text))return null;
 const n=Number(text);
 return Number.isFinite(n)&&n>=0&&n<=100000?n:null;
}
export function compareManuallyEnteredPrices(options:readonly ManualPriceOption[]):ManualComparison{
 const usable=options.flatMap(x=>{
  const price=amount(x.price),extra=amount(x.extra,true),store=x.store.trim();
  if(!store||price===null||price<=0||extra===null)return [];
  const total=Math.round((price+extra)*100)/100;
  if(total>100000)return [];
  return [{option:x,total,normalized:store.toLocaleLowerCase()}];
 }).sort((a,b)=>a.total-b.total||a.normalized.localeCompare(b.normalized));
 const best=usable[0]??null;
 const second=usable.find(x=>x.normalized!==best?.normalized)??null;
 return {ready:!!best&&!!second,validOptions:usable.length,cheaper:second?best?.option??null:null,
  runnerUp:second?.option??null,cheapestTotalJod:second?best?.total??null:null,
  alternativeTotalJod:second?.total??null,
  differenceJod:second&&best?Math.round((second.total-best.total)*100)/100:null,
  tied:!!second&&!!best&&Math.abs(second.total-best.total)<.005};
}
