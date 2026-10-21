import {createFileRoute} from "@tanstack/react-router";
import {FamilyDiscoverHome} from "@/components/FamilyDiscoverHome";

/** Discovery stays in one user journey; historical deep links remain valid. */
export const Route=createFileRoute("/explore/")({
 head:()=>({meta:[
  {title:"Discover family experiences — Dabberna"},
  {name:"description",content:"Explore family experiences with sourced parent advice and one family plan."}
 ]}),
 component:Explore
});
export function Explore(){return <FamilyDiscoverHome/>;}
