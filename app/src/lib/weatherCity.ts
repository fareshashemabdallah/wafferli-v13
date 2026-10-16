/** Only a city the parent typed in preferences or explicitly chose for weather.
 * No geolocation, IP lookup or background family-profile access. */
const supported=[
 {name:"Amman",names:["amman","عمّان","عمان"]},
 {name:"Irbid",names:["irbid","إربد","اربد"]},
 {name:"Zarqa",names:["zarqa","الزرقاء","زرقاء"]},
 {name:"Aqaba",names:["aqaba","العقبة","عقبة"]}
] as const;
export function preferredWeatherCity(preferred:string,chosen:string):string{
 if(supported.some(c=>c.name===chosen))return chosen;
 const term=preferred.trim().toLocaleLowerCase().replace(/\s+/g," ");
 return supported.find(c=>c.names.some(name=>
  term===name||term.startsWith(name+",")||term.startsWith(name+"،")||term.startsWith(name+" ")
 ))?.name??"";
}
