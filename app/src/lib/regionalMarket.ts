/** Country metadata for localization and future discovery; NOT a claim of commercial launch.
 * Do not use country currency to reinterpret existing JOD financial records.
 */
export const COUNTRY_KEY = "countryCode";
export const COUNTRIES = [
 {code:"JO",en:"Jordan",ar:"الأردن",fr:"Jordanie",currencies:["JOD"],priority:"core"},
 {code:"LB",en:"Lebanon",ar:"لبنان",fr:"Liban",currencies:["LBP","USD"],priority:"core"},
 {code:"SY",en:"Syria",ar:"سوريا",fr:"Syrie",currencies:["SYP"],priority:"core"},
 {code:"OM",en:"Oman",ar:"عُمان",fr:"Oman",currencies:["OMR"],priority:"core"},
 {code:"SA",en:"Saudi Arabia",ar:"السعودية",fr:"Arabie saoudite",currencies:["SAR"],priority:"core"},
 {code:"AE",en:"United Arab Emirates",ar:"الإمارات العربية المتحدة",fr:"Émirats arabes unis",currencies:["AED"],priority:"core"},
 {code:"QA",en:"Qatar",ar:"قطر",fr:"Qatar",currencies:["QAR"],priority:"core"},
 {code:"BH",en:"Bahrain",ar:"البحرين",fr:"Bahreïn",currencies:["BHD"],priority:"core"},
 {code:"KW",en:"Kuwait",ar:"الكويت",fr:"Koweït",currencies:["KWD"],priority:"core"},
 {code:"IQ",en:"Iraq",ar:"العراق",fr:"Irak",currencies:["IQD"],priority:"core"},
 {code:"EG",en:"Egypt",ar:"مصر",fr:"Égypte",currencies:["EGP"],priority:"core"},
 {code:"MA",en:"Morocco",ar:"المغرب",fr:"Maroc",currencies:["MAD"],priority:"core"},
 {code:"DZ",en:"Algeria",ar:"الجزائر",fr:"Algérie",currencies:["DZD"],priority:"core"},
 {code:"TN",en:"Tunisia",ar:"تونس",fr:"Tunisie",currencies:["TND"],priority:"core"},
 {code:"PS",en:"Palestine",ar:"فلسطين",fr:"Palestine",currencies:["ILS","JOD","USD"],priority:"core"},
 {code:"LY",en:"Libya",ar:"ليبيا",fr:"Libye",currencies:["LYD"],priority:"future"},
 {code:"SD",en:"Sudan",ar:"السودان",fr:"Soudan",currencies:["SDG"],priority:"future"},
 {code:"YE",en:"Yemen",ar:"اليمن",fr:"Yémen",currencies:["YER"],priority:"future"},
 {code:"MR",en:"Mauritania",ar:"موريتانيا",fr:"Mauritanie",currencies:["MRU"],priority:"future"},
 {code:"DJ",en:"Djibouti",ar:"جيبوتي",fr:"Djibouti",currencies:["DJF"],priority:"future"},
 {code:"SO",en:"Somalia",ar:"الصومال",fr:"Somalie",currencies:["SOS"],priority:"future"},
 {code:"KM",en:"Comoros",ar:"جزر القمر",fr:"Comores",currencies:["KMF"],priority:"future"}
] as const;
export type CountryCode=(typeof COUNTRIES)[number]["code"];
export type DisplayLanguage="ar"|"en"|"fr";
export function isCountryCode(value:unknown):value is CountryCode{
 return typeof value==="string"&&COUNTRIES.some(c=>c.code===value);
}
export function getCountry(value:unknown){
 return COUNTRIES.find(c=>c.code===value)??COUNTRIES[0];
}
export function countryName(value:unknown,lang:DisplayLanguage){
 return getCountry(value)[lang];
}
/** Selection is informative only; this is never an FX conversion. */
export function indicativeCurrencies(value:unknown):readonly string[]{
 return getCountry(value).currencies;
}
export function formatLocalizedCurrency(amount:number,currency:string,lang:DisplayLanguage):string{
 if(!Number.isFinite(amount)||!/^([A-Z]{3})$/.test(currency))throw new Error("Invalid currency amount");
 return new Intl.NumberFormat({ar:"ar",en:"en",fr:"fr"}[lang],{style:"currency",currency}).format(amount);
}
