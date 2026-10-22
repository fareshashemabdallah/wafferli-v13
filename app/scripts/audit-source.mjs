#!/usr/bin/env node
/** Read-only source inventory for the published Dabberna SPA.
 * Never delete files based on this report alone. Dynamic imports, backend
 * tools, public asset references, generated routes and tests need review.
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const sourceRoot=path.join(app,"src");
const pkg=JSON.parse(fs.readFileSync(path.join(app,"package.json"),"utf8"));
const extensions=[".ts",".tsx",".js",".jsx",".mjs",".css",".json"];
const slashes=p=>p.split(path.sep).join("/");
const files=(dir)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>{
 const name=path.join(dir,item.name);
 return item.isDirectory()?files(name):[name];
});
const all=files(sourceRoot).filter(p=>extensions.some(e=>p.endsWith(e)));
const appFiles=[...fs.readdirSync(app,{withFileTypes:true})
 .filter(entry=>entry.isFile()&&/\.(mjs|js|ts|tsx)$/.test(entry.name))
 .map(entry=>path.join(app,entry.name)),...files(path.join(app,"scripts"))];
const imports=(text)=>{
 const refs=[];
 const patterns=[
  /\b(?:import|export)\s+(?:type\s+)?(?:[^"'();]*?\s+from\s*)?["']([^"']+)["']/g,
  /\b(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/g,
  /@import\s+(?:url\()?["']([^"']+)["']/g
 ];
 for(const r of patterns)for(const m of text.matchAll(r))refs.push(m[1]);
 return refs;
};
const known=new Set(all.map(p=>path.resolve(p)));
const external=new Set(),usedByRuntime=new Map(),seen=new Set(),missingLocal=[];
const externalName=s=>s.startsWith("@")?s.split("/").slice(0,2).join("/"):s.split("/")[0];
function resolveModule(from,id){
 let target;
 if(id.startsWith("@/"))target=path.join(sourceRoot,id.slice(2));
 else if(id.startsWith("./")||id.startsWith("../"))target=path.resolve(path.dirname(from),id);
 else return null;
 const candidates=[target,...extensions.map(e=>target+e),...extensions.map(e=>path.join(target,"index"+e))];
 return candidates.find(c=>known.has(path.resolve(c)))??null;
}
function visit(p){
 p=path.resolve(p);if(seen.has(p)||!known.has(p))return;
 seen.add(p);
 const contents=fs.readFileSync(p,"utf8");
 for(const imp of imports(contents)){
  if(imp.startsWith("node:")||imp.startsWith("data:"))continue;
  const local=resolveModule(p,imp);
  if(local){const next=usedByRuntime.get(local)??new Set();next.add(p);usedByRuntime.set(local,next);visit(local);}
  else if(imp.startsWith("@/")||imp.startsWith("./")||imp.startsWith("../")){
   // Asset imports, generated paths, and import.meta special cases may need hand review.
   if(!/\.(svg|png|jpg|jpeg|webp|avif|woff2?|txt|html|wasm)(\?.*)?$/.test(imp))
    missingLocal.push({from:slashes(path.relative(app,p)),specifier:imp});
  }else external.add(externalName(imp));
 }
}
// This is a static SPA. Importing the generated TanStack router includes all routes.
// Do not count SSR/server-only files as shipped unless another module imports them.
visit(path.join(sourceRoot,"main.tsx"));
const runtime=all.filter(p=>seen.has(path.resolve(p)));
const orphan=all.filter(p=>!seen.has(path.resolve(p))&&!/(\.test|\.spec)\.[tj]sx?$/.test(p)&&
 !p.includes("/test/")&&!p.endsWith(".d.ts")&&
 !p.endsWith("/server.ts")&&!p.endsWith("/start.ts"));
// Packages used by any tests/configuration/scripts/server-side files aren't automatically removable.
const anyRefs=new Set();
for(const p of [...all,...appFiles]){
 if(!/\.(ts|tsx|mjs|js|jsx|css)$/.test(p))continue;
 const content=fs.readFileSync(p,"utf8");
 for(const i of imports(content))if(!i.startsWith(".")&&!i.startsWith("@/")&&!i.startsWith("node:"))
  anyRefs.add(externalName(i));
}
const allDeclared=Object.keys({...pkg.dependencies,...pkg.devDependencies});
const usedPackages=allDeclared.filter(d=>anyRefs.has(d));
const unreferenced=allDeclared.filter(d=>!anyRefs.has(d));
// These are not necessarily unused: CLIs can appear only in package scripts/workflows,
// Vite plugins, Tailwind directives and generated runtime modules.
const allRouteFiles=all.filter(p=>/[/\\]routes[/\\].*\.[tj]sx?$/.test(p));
console.log("DABBERNA SOURCE AUDIT — static import inventory; candidate lists are NOT deletion instructions");
console.log(JSON.stringify({
 scannedSourceFiles:all.length,shippedSourceFiles:runtime.length,
 routeFiles:allRouteFiles.length,reachableRoutes:allRouteFiles.filter(p=>seen.has(p)).length,
 unreachableNonTestSources:orphan.length,
 unreferencedDeclaredPackages:unreferenced.length,
 runtimeExternalPackages:[...external].sort(),
 missingLocalImports:missingLocal.slice(0,30)
},null,2));
console.log("\nUNREACHABLE PRODUCTION SOURCE CANDIDATES:");
for(const p of orphan)console.log("  "+slashes(path.relative(app,p)));
const incoming=new Map();
for(const from of all){
 for(const id of imports(fs.readFileSync(from,"utf8"))){
  const target=resolveModule(from,id);
  if(!target)continue;
  const refs=incoming.get(target)??[];
  refs.push(slashes(path.relative(app,from)));
  incoming.set(target,refs);
 }
}
console.log("\nUNREACHABLE SOURCES WITH INCOMING LINKS (tests or other dormant files):");
for(const p of orphan){
 const links=incoming.get(p)??[];
 console.log("  "+slashes(path.relative(app,p))+" <- "+
  (links.length?links.slice(0,4).join(", ")+(links.length>4?" +"+(links.length-4):""):"NO LOCAL IMPORTS"));
}
console.log("\nPACKAGES NOT REFERENCED BY SOURCE IMPORTS (review scripts/toolchains):");
for(const p of unreferenced)console.log("  "+p);
console.log("\nDIRECT IMPORTED PACKAGES FOUND IN SOURCE:");
for(const p of usedPackages)console.log("  "+p);
console.log("\nNOTE: all file routes are reachable by direct URL even if not in main navigation. Do not automatically remove routes, database migrations, live-AI server code, backups or public assets.");
