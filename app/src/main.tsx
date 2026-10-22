import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root container");
createRoot(root).render(<React.StrictMode><RouterProvider router={getRouter()} /></React.StrictMode>);

// Static app-shell caching only. Finance records remain browser-local.
// A prior release may be held open behind an older offline shell. Check for a
// newer worker whenever the published app is opened again or re-focused.
if(import.meta.env.PROD&&typeof window!=="undefined"&&"serviceWorker" in navigator){
 let reloadedForUpdate=false;
 navigator.serviceWorker.addEventListener("controllerchange",()=>{
  if(reloadedForUpdate)return;
  reloadedForUpdate=true;
  window.location.reload();
 });
 window.addEventListener("load",()=>{
  if(!window.location.pathname.startsWith(import.meta.env.BASE_URL))return;
  void navigator.serviceWorker.register(import.meta.env.BASE_URL+"offline-sw.js",{
   scope:import.meta.env.BASE_URL,updateViaCache:"none"
  }).then(registration=>{
   void registration.update().catch(()=>{});
   const check=()=>{if(document.visibilityState==="visible")
    void registration.update().catch(()=>{});};
   document.addEventListener("visibilitychange",check);
  }).catch(()=>{/* Offline caching is optional. The online site still works. */});
 },{once:true});
}

