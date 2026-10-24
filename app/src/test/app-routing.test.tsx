import { QueryClient } from "@tanstack/react-query";
import {readFileSync} from "node:fs";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
 it("publishes only finalized family and information routes, not retired commerce or social prototypes",()=>{
  const content=readFileSync(new URL("../routeTree.gen.ts",import.meta.url),"utf8");
  for(const route of ["/","/advisor","/family","/money","/calendar","/plans","/occasions","/about"]){
   expect(content).toContain("fullPath: '"+route+"'");
  }
  for(const route of ["/explore/","/explore/shopping","/explore/smartbuy",
   "/explore/market","/explore/weekend","/explore/together",
   "/explore/restaurants","/explore/services","/community","/experience",
   "/vote/$token","/together/$adminToken"]){
   expect(content).not.toContain("fullPath: '"+route+"'");
  }
 });

});