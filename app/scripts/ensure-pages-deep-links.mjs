/**
 * GitHub Pages serves files, not SPA routes. Dabberna uses hash history.
 * Publish tiny redirect entry pages for every concrete registered route,
 * plus a 404 fallback for dynamic routes and copied/old deep links.
 *
 * This runs after the Vite build, so it cannot accidentally deploy the
 * old root-level prototype instead of the modern React application.
 */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from "node:fs";
import {resolve,dirname,join} from "node:path";
import {fileURLToPath} from "node:url";

const app=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const dist=resolve(app,"../react-dist");
const routeTree=readFileSync(resolve(app,"src/routeTree.gen.ts"),"utf8");
const base="/wafferli-v13/";
if(!existsSync(join(dist,"index.html")))throw Error("Vite index.html was not built");

const routes=[...new Set([...routeTree.matchAll(/\sfullPath: '([^']+)'/g)]
 .map(match=>match[1])
 .filter(path=>path&&path!=="/"&&!path.includes("$")&&
   /^\/(?:[a-z0-9-]+\/?)+$/i.test(path)))];
if(!routes.includes("/family")||!routes.includes("/advisor")||!routes.includes("/about"))
 throw Error("Required Dabberna routes missing from generated route tree");

const safeHtml=(value)=>value.replaceAll("&","&amp;").replaceAll("<","&lt;")
 .replaceAll(">","&gt;").replaceAll('"',"&quot;");
const redirectPage=(route)=>{
 const target=base+"#"+route.replace(/\/$/,"");
 const safe=safeHtml(target);
 return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>Opening Dabberna | دبّرنا</title>
<meta http-equiv="refresh" content="0;url=${safe}"/>
<script>
/* The official app uses hash URLs so Github Pages always serves /index.html. */
location.replace(${JSON.stringify(target)} + location.search);
</script>
</head>
<body><p>Opening Dabberna… <a href="${safe}">Open the app</a></p></body>
</html>
`;
};
for(const path of routes){
 const dest=join(dist,path.slice(1).replace(/\/$/,""),"index.html");
 mkdirSync(dirname(dest),{recursive:true});
 writeFileSync(dest,redirectPage(path));
}
// A copied/unknown direct link cannot be emitted as a static route.
// The 404 fallback redirects to the same route in the hash-based React app.
const fallback=`<!doctype html>
<html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>Opening Dabberna | دبّرنا</title>
<script>
(function(){
 var base="/wafferli-v13/";
 var pathname=location.pathname;
 var rest=pathname.indexOf(base)===0?pathname.slice(base.length):"";
 // Never treat a missing .js/.css/image as an app screen.
 if(rest.indexOf("assets/")===0 || /\\.[a-z0-9]+$/i.test(rest))return;
 var route=rest.replace(/^\\/+|\\/+$/g,"");
 // Retired discovery/community URLs must not resurrect unfinished UI.
 var retired=/^(?:explore(?:\\/|$)|community(?:\\/|$)|experience(?:\\/|$)|vote(?:\\/|$)|together(?:\\/|$))/i.test(route);
 location.replace(base+(retired?"#/family":route?"#/"+route+location.search:""));
})();
</script></head>
<body><p>Opening Dabberna… <a href="/wafferli-v13/">Open the app</a></p></body></html>
`;
writeFileSync(join(dist,"404.html"),fallback);

// Deployment smoke checks: compilation passed and original mistaken deep link
// will open the correct app route after GitHub Pages' directory redirect.
const familyFile=join(dist,"family/index.html");
if(!existsSync(familyFile)||
 !readFileSync(familyFile,"utf8").includes("/wafferli-v13/#/family")||
 !readFileSync(join(dist,"404.html"),"utf8").includes("location.replace"))
 throw Error("GitHub Pages deep-link recovery is missing");
process.stdout.write(`Generated ${routes.length} direct-route entry pages and 404 fallback.\n`);
