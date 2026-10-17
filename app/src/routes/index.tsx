import {createFileRoute} from "@tanstack/react-router";
import {AppShell} from "@/components/AppShell";
import {IllustratedFamilyHome} from "@/components/IllustratedFamilyHome";

export const Route=createFileRoute("/")({
 head:()=>({meta:[
  {title:"Dabberna — A calmer, brighter tomorrow for your family"},
  {name:"description",content:"Your family's Today, Ask Dabberna, Our Plans, detailed finances, shopping and calendar—thoughtfully connected."},
  {property:"og:title",content:"Dabberna | دبّرنا — Family Life, Planned Better"}
 ]}),
 component:Index
});
export function Index(){
 return <AppShell homeLayout><IllustratedFamilyHome/></AppShell>;
}
