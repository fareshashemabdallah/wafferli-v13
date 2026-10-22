/** Accept household amounts typed on English or Arabic keyboards, with or
 * without a grouping separator. Parsing is explicit: blank is not zero. */
export function parseHouseholdAmount(raw:string,max=100000):number|null{
 let value=raw.trim()
  .replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
  .replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
  .replace(/\u066B/g,".") // Arabic decimal separator
  .replace(/\u066C/g,",") // Arabic grouping separator
  .replace(/\u00A0/g," ");
 if(!value)return null;
 // Only groupings of exactly three digits are allowed; single comma followed
 // by one or two digits is treated as a decimal mark when no dot is present.
 if(value.includes(",")){
  if(!value.includes(".")&&/^\d+,\d{1,2}$/.test(value))value=value.replace(",",".");
  else if(/^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/.test(value))value=value.replace(/,/g,"");
  else return null;
 }
 if(!/^\d{1,9}(?:\.\d{1,2})?$/.test(value))return null;
 const amount=Number(value);
 return Number.isFinite(amount)&&amount>=0&&amount<=max?Math.round(amount*100)/100:null;
}
