import {useEffect,useState} from "react";
import {createFileRoute} from "@tanstack/react-router";
import {AppShell} from "@/components/AppShell";
import {AdventureFamilyHome} from "@/components/AdventureFamilyHome";
import {AppWelcome,shouldShowWelcome,WELCOME_SEEN_KEY} from "@/components/AppWelcome";
import {writeLocal} from "@/lib/storage";

export const Route=createFileRoute("/")({
 head:()=>({meta:[
  {title:"Dabberna | دبّرنا — Family Life, Made Easier"},
  {name:"description",content:"One welcoming place for family money, moments and everyday decisions."},
  {property:"og:title",content:"Dabberna | دبّرنا — Family Life, Made Easier"}
 ]}),
 component:Index
});
export function Index(){
 // Defer first-launch checks until hydration; returning families go straight to Today.
 const [showWelcome,setShowWelcome]=useState(false);
 useEffect(()=>setShowWelcome(shouldShowWelcome()),[]);
 function enterToday(){
  writeLocal(WELCOME_SEEN_KEY,true);
  setShowWelcome(false);
  // Clear optional preview/install query without disturbing the hash router.
  const u=new URL(window.location.href);
  u.searchParams.delete("welcome");
  window.history.replaceState(window.history.state,"",u.pathname+u.search+u.hash);
 }
 return showWelcome?<AppWelcome onContinue={enterToday}/>:
  <AppShell homeLayout><AdventureFamilyHome/></AppShell>;
}