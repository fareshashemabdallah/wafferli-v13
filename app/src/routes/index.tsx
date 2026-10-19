import {createFileRoute} from "@tanstack/react-router";
import {AppShell} from "@/components/AppShell";
import {FocusedFamilyHome} from "@/components/FocusedFamilyHome";
import {LandingDesignPreview} from "@/components/LandingDesignPreview";
import {AdventureFamilyHome} from "@/components/AdventureFamilyHome";

export const Route=createFileRoute("/")({
 head:()=>({meta:[
  {title:"Dabberna — Care for your family money. Live well together."},
  {name:"description",content:"Your family money journey: understand essentials, protect what matters, prepare for upcoming commitments and live well together."},
  {property:"og:title",content:"Dabberna | دبّرنا — Family Life, Planned Better"}
 ]}),
 component:Index
});
export function Index(){
 if(typeof window!=="undefined"){
  const preview=new URLSearchParams(window.location.search).get("preview");
  if(preview==="landing")return <LandingDesignPreview/>;
  if(preview==="classic")return <AppShell homeLayout><FocusedFamilyHome/></AppShell>;
 }
 return <AppShell homeLayout><AdventureFamilyHome/></AppShell>;
}
