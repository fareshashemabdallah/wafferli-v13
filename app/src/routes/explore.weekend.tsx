import {createFileRoute} from "@tanstack/react-router";
import {WeekendOutingExperience} from "@/components/WeekendOutingExperience";
export const Route=createFileRoute("/explore/weekend")({
 head:()=>({meta:[
  {title:"Can we afford a family outing this weekend? — Dabberna"},
  {name:"description",content:"Review a cautious family outing limit from your own saved figures, then find publicly mapped activities with source links."}
 ]}),
 component:WeekendOutingExperience
});
