import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const base=(file:string)=>readFileSync(new URL("../../public/"+file,import.meta.url),"utf8");
describe("repository-scoped static-only offline shell",()=>{
 it("keeps manifest under GitHub Pages and provides usable brand icon metadata",()=>{
  const manifest=JSON.parse(base("manifest.webmanifest")) as {
   id:string;start_url:string;scope:string;display:string;
   icons:Array<{src:string;type:string;sizes:string}>;
  };
  expect(manifest.start_url).toBe("/wafferli-v13/?welcome=1");
  expect(manifest.id).toBe("/wafferli-v13/");
  expect(manifest.scope).toBe("/wafferli-v13/");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.some(i=>i.src==="app-icon.svg"&&i.type==="image/svg+xml")).toBe(true);
  expect(base("app-icon.svg")).toContain("viewBox");
 });
 it("rejects POST, third-party origins and nonstatic requests before any cache action",()=>{
  const code=base("offline-sw.js");
  expect(code).toContain("dabberna-static-shell-20261029-illustrated-v1");
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
 it("publishes preview from the current source, not an older masked-amount branch",()=>{
  const deploy=readFileSync(resolve(process.cwd(),"../.github/workflows/dabberna-deploy.yml"),"utf8");
  expect(deploy).not.toContain("ref: design/clean-slate-single-category-2026-10-21");
  expect(deploy).toContain("bunx vite build --base=/wafferli-v13/preview/ --outDir ../preview-dist");
  expect(deploy).toContain("build-revision.txt");
  expect(deploy).toContain("Hide private amounts|Reveal amounts|Show private amounts");
 });
 it("does not ship the old amount reveal switches in current Money or Today",()=>{
  const read=(name:string)=>readFileSync(new URL("../components/"+name,import.meta.url),"utf8");
  for(const file of ["FamilyMoneyRhythm.tsx","AdventureFamilyHome.tsx",
   "FamilyMoneyPrototypeHome.tsx","OneMoneyDashboardSummary.tsx","UnifiedCategoryDetails.tsx"]){
   const component=read(file);
   expect(component).not.toContain("Hide private amounts");
   expect(component).not.toContain("Reveal amounts");
   expect(component).not.toContain("Show private amounts");
   expect(component).not.toContain("••••");
  }
 });
});
