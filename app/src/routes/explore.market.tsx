import {createFileRoute,Navigate} from "@tanstack/react-router";
 
/** Retired, unshipped feature. Keep only this tiny old-bookmark redirect;
 * do not resurrect stale shopping, search, circles or poll data flows. */
export const Route=createFileRoute("/explore/market")({
 component:()=> <Navigate to="/plans" replace/>
});
