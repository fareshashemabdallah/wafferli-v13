import {createFileRoute,Navigate} from "@tanstack/react-router";
/** Retired circles/poll feature: historical links return to the approved Family area. */
export const Route=createFileRoute("/vote/$token")({component:()=> <Navigate to="/family" replace/>});
