import {createFileRoute} from "@tanstack/react-router";
import {FamilyActivityExplorer} from "@/components/FamilyActivityExplorer";
export const Route=createFileRoute("/explore/weekend")({
 head:()=>({meta:[
  {title:"Explore Family Activities — Dabberna"},
  {name:"description",content:"Explore children's activity ideas and real mapped places first, with optional family planning and finances."}
 ]}),
 component:FamilyActivityExplorer
});
