import {createFileRoute,Navigate} from "@tanstack/react-router";
 
/** Retired, unshipped feature. Keep only this tiny old-bookmark redirect;
 * do not resurrect stale shopping, search, circles or poll data flows. */
export const Route=createFileRoute("/explore/restaurants")({
 component:()=> <Navigate to="/family" replace/>
});
