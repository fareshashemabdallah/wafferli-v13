import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const base=(file:string)=>readFileSync(new URL("../../public/"+file,import.meta.url),"utf8");
describe("repository-scoped static-only offline shell",()=>{
 it("keeps manifest under GitHub Pages and provides usable brand icon metadata",()=>{
  const manifest=JSON.parse(base("manifest.webmanifest")) as {
   start_url:string;scope:string;display:string;
   icons:Array<{src:string;type:string;sizes:string}>;
  };
  expect(manifest.start_url).toBe("/wafferli-v13/");
  expect(manifest.scope).toBe("/wafferli-v13/");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.some(i=>i.src==="app-icon.svg"&&i.type==="image/svg+xml")).toBe(true);
  expect(base("app-icon.svg")).toContain("viewBox");
 });
 it("rejects POST, third-party origins and nonstatic requests before any cache action",()=>{
  const code=base("offline-sw.js");
  expect(code).toContain('request.method!=="GET"');
  expect(code).toContain("url.origin!==self.location.origin");
  expect(code).toContain("url.pathname.startsWith(SCOPE)");
  expect(code).toContain("request.destination");
  expect(code).toContain('url.pathname.startsWith(SCOPE+"assets/")');
  expect(code).toContain('if(!isAllowedStatic(request))return;');
  expect(code).not.toMatch(/supabase|auth-token|localStorage|indexedDB|\\.json\\?user/i);
 });
 it("does not use an unrestricted cache-first response for SPA navigations",()=>{
  const code=base("offline-sw.js");
  expect(code).toContain('if(request.mode==="navigate")');
  expect(code).toContain("await fetch(request)");
  expect(code).toContain("await caches.match(SHELL)");
  expect(code).toContain("if(url.pathname!==SCOPE)return;");
 });
});
