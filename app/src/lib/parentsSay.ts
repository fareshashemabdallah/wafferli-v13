import {isCountryCode,type CountryCode,type DisplayLanguage} from "./regionalMarket";
/** What Parents Say: private pilot models. None of these records are public or verified. */
export const PARENTS_SAY_PLACES_KEY="parentsSayPlaces";
export const PARENTS_SAY_REVIEWS_KEY="parentsSayReviews";
export const reviewCategories=["activities","restaurants","services","products"] as const;
export type ReviewCategory=typeof reviewCategories[number];
export const reviewAges=["0-2","3-5","6-9","10+","prefer-not"] as const;
export type ReviewAge=typeof reviewAges[number];
export type ParentPlace={id:string;name:string;area:string;category:ReviewCategory;createdAt:string;countryCode?:CountryCode};
export type ExperienceRating="positive"|"mixed"|"negative";
export type SafetyObservation="comfortable"|"concerns"|"not-assessed";
export type ConvenienceRating="yes"|"somewhat"|"no"|"not-assessed";
export type ReturnChoice="yes"|"maybe"|"no";
export type ParentReview={
 id:string;placeId:string;createdAt:string;updatedAt:string;
 age:ReviewAge;experience:ExperienceRating;safety:SafetyObservation;
 convenience:ConvenienceRating;wouldReturn:ReturnChoice;comment:string;
 providerSummaryOptIn:boolean;parentQuestionsOptIn:boolean;language?:DisplayLanguage;
};
/** A place is only a manually entered local record; it is not a verified Google listing. */
export function createParentPlace(input:{name:string;area:string;category:ReviewCategory;countryCode?:CountryCode},id:string,now:string):ParentPlace|null{
 const name=input.name.trim().replace(/\s+/g," ");
 const area=input.area.trim().replace(/\s+/g," ");
 if((input.countryCode!==undefined&&!isCountryCode(input.countryCode))||name.length<3||name.length>100||(input.category!=="products"&&area.length<2)||area.length>80||!reviewCategories.includes(input.category))return null;
 return {id,name,area,category:input.category,createdAt:now,countryCode:input.countryCode??"JO"};
}
export function sameParentPlace(a:ParentPlace,b:ParentPlace){
 return (a.countryCode??"JO")===(b.countryCode??"JO")&&a.category===b.category&&a.name.toLocaleLowerCase()===b.name.toLocaleLowerCase()&&a.area.toLocaleLowerCase()===b.area.toLocaleLowerCase();
}
export type ReviewInput=Pick<ParentReview,"age"|"experience"|"safety"|"convenience"|"wouldReturn"|"comment"|"providerSummaryOptIn"|"parentQuestionsOptIn">;
export function createParentReview(input:ReviewInput,placeId:string,id:string,now:string,previous?:ParentReview):ParentReview|null{
 const comment=input.comment.trim().replace(/\s+/g," ");
 if(!placeId||comment.length<20||comment.length>1500||
 !reviewAges.includes(input.age)||
 !["positive","mixed","negative"].includes(input.experience)||
 !["comfortable","concerns","not-assessed"].includes(input.safety)||
 !["yes","somewhat","no","not-assessed"].includes(input.convenience)||
 !["yes","maybe","no"].includes(input.wouldReturn)||
 typeof input.providerSummaryOptIn!=="boolean"||typeof input.parentQuestionsOptIn!=="boolean")return null;
 return {id:previous?.id??id,placeId,createdAt:previous?.createdAt??now,updatedAt:now,
 age:input.age,experience:input.experience,safety:input.safety,
 convenience:input.convenience,wouldReturn:input.wouldReturn,comment,
 providerSummaryOptIn:input.providerSummaryOptIn,parentQuestionsOptIn:input.parentQuestionsOptIn,
 ...(previous?.language?{language:previous.language}:{})};
}
export function upsertParentReview(all:ParentReview[],entry:ParentReview){
 // One editable review per place, per local browser, not multiple duplicate reviews.
 return [entry,...all.filter(x=>x.id!==entry.id&&x.placeId!==entry.placeId)];
}
export function reportedReviewCount(reviews:ParentReview[],placeId:string){
 return reviews.filter(r=>r.placeId===placeId).length;
}
/** Only outbound links are built here; no Google/Instagram review scraping or implicit endorsement. */
export function parentReviewExternalSearch(name:string,area:string,source:"maps"|"web"){
 const terms=[name,area].filter(Boolean).join(" ");
 return source==="maps"
  ?"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(terms)
  :"https://www.google.com/search?q="+encodeURIComponent(terms+" reviews parent experiences");
}
