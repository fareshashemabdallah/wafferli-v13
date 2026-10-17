import type {ReactNode} from "react";
import {UnifiedFamilyShell} from "./UnifiedFamilyShell";

/** Every signed-in family page uses the same navigation and visual frame.
 * Keep the AppShell API stable so no existing workflows or records change. */
export function AppShell({children,title,homeLayout=false}:{
 children:ReactNode;title?:string;homeLayout?:boolean
}){
 return <UnifiedFamilyShell {...(title!==undefined?{title}:{})} homeLayout={homeLayout}>{children}</UnifiedFamilyShell>;
}
export function PilotBadge({children="Sample"}:{children?:ReactNode}){
 return <span className="inline-flex rounded-full bg-warn px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-warn-foreground">{children}</span>;
}
export function Notice({children}:{children:ReactNode}){
 return <div className="rounded-2xl border border-[#DAE6D8] bg-[#F0F6EC] p-4 text-sm leading-relaxed text-ink">{children}</div>;
}
