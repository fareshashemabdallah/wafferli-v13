/* Dabberna static shell cache. IMPORTANT: never cache auth, finance API,
 * shopping/provider responses, POST requests or external origins.
 * User data remains in browser storage only and is not copied here.
 */
const CACHE="dabberna-static-shell-20261029-illustrated-v1";
const PREFIX="dabberna-static-shell-";
const SCOPE=new URL("./",self.registration.scope).pathname;
const SHELL=SCOPE;
const OFFLINE_STATIC=[SHELL,SCOPE+"manifest.webmanifest",SCOPE+"app-icon.svg",SCOPE+"apple-touch-icon.png",SCOPE+"landing-family-characters.avif"];

function isAllowedStatic(request){
 if(request.method!=="GET")return false;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||url.search)return false;
 if(!url.pathname.startsWith(SCOPE))return false;
 const staticPath=url.pathname.startsWith(SCOPE+"assets/")||
   ["app-icon.svg","apple-touch-icon.png","landing-family-characters.avif","manifest.webmanifest"].some(name=>url.pathname===SCOPE+name);
 return staticPath&&["script","style","image","font","manifest"].includes(request.destination);
}
self.addEventListener("install",event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(OFFLINE_STATIC);
  await self.skipWaiting();
 })());
});
self.addEventListener("activate",event=>{
 event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(name=>name.startsWith(PREFIX)&&name!==CACHE)
   .map(name=>caches.delete(name)));
  await self.clients.claim();
 })());
});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET")return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(SCOPE))return;

 if(request.mode==="navigate"){
  // Always prefer a fresh first-party static HTML response, offline fallback
  // only for previously visited SPA shell. Do not cache auth callbacks or
  // unexpected paths; GitHub Pages app is hash-routed at the repository root.
  if(url.pathname!==SCOPE)return;
  event.respondWith((async()=>{
   try{
    const response=await fetch(request);
    if(response.ok&&response.type==="basic"&&!url.search){
     const cache=await caches.open(CACHE);
     await cache.put(SHELL,response.clone());
    }
    return response;
   }catch{
    const cached=await caches.match(SHELL);
    return cached??Response.error();
   }
  })());
  return;
 }
 if(!isAllowedStatic(request))return;
 event.respondWith((async()=>{
  const cached=await caches.match(request);
  if(cached)return cached;
  const response=await fetch(request);
  if(response.ok&&response.type==="basic"){
   const cache=await caches.open(CACHE);
   await cache.put(request,response.clone());
  }
  return response;
 })());
});
