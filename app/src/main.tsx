import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root container");
createRoot(root).render(<React.StrictMode><RouterProvider router={getRouter()} /></React.StrictMode>);

// Static app-shell caching only. No API responses, sessions or private records
// are cached by the worker. Register only in released HTTPS builds.
if(import.meta.env.PROD&&typeof window!=="undefined"&&"serviceWorker" in navigator){
 window.addEventListener("load",()=>{
  if(window.location.pathname.startsWith(import.meta.env.BASE_URL)){
   void navigator.serviceWorker.register(import.meta.env.BASE_URL+"offline-sw.js",{
    scope:import.meta.env.BASE_URL
   }).catch(()=>{/* Offline shell is optional; normal online app still works. */});
  }
 },{once:true});
}

