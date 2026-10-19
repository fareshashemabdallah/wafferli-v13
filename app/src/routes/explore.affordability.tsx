import {createFileRoute} from "@tanstack/react-router";
import {WeekendOutingExperience} from "@/components/WeekendOutingExperience";
/** Existing cautious cash-and-bills calculator retained as an optional second step. */
export const Route=createFileRoute("/explore/affordability")({
 head:()=>({meta:[
  {title:"Optional Outing Budget Review — Dabberna"},
  {name:"description",content:"Optional planning review of manually entered cash, bills and household spending."}
 ]}),
 component:WeekendOutingExperience
});
