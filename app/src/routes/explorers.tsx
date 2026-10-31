import {createFileRoute} from "@tanstack/react-router";
import {AppShell} from "@/components/AppShell";
import {LittleExplorers} from "@/components/LittleExplorers";

export const Route=createFileRoute("/explorers")({
 head:()=>({meta:[{title:"Little Explorers — Dabberna"},{name:"description",content:"A short, parent-guided memory game with a real-world discovery mission."}]}),
 component:LittleExplorersPage
});
function LittleExplorersPage(){
 return <AppShell><LittleExplorers/></AppShell>;
}
