import {createFileRoute} from "@tanstack/react-router";
import {useState} from "react";
import {FamilyActivityExplorer} from "@/components/FamilyActivityExplorer";
import {WeekendOutingExperience} from "@/components/WeekendOutingExperience";
export const Route=createFileRoute("/explore/weekend")({
 head:()=>({meta:[
  {title:"Explore Family Activities — Dabberna"},
  {name:"description",content:"Discover children's activities and map-sourced places first; choose a separate cautious affordability review if needed."}
 ]}),
 component:WeekendFlow
});
function WeekendFlow(){
 const [financialReview,setFinancialReview]=useState(false);
 return financialReview?
  <WeekendOutingExperience onBack={()=>setFinancialReview(false)}/>:
  <FamilyActivityExplorer onShowAffordability={()=>setFinancialReview(true)}/>;
}
