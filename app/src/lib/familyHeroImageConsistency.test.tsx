import {afterEach,describe,expect,it} from "vitest";
import {cleanup,render,screen} from "@testing-library/react";
import {readFileSync} from "node:fs";
import {FAMILY_HERO_LAYOUT,FAMILY_HERO_TEXT,FamilyHeroIllustration} from "@/components/FamilyHeroIllustration";

afterEach(cleanup);
const source=(path:string)=>readFileSync(new URL(path,import.meta.url),"utf8");
describe("Dabberna image proportions across all live pages",()=>{
 it("uses one responsive, non-overlay banner layout with room for text",()=>{
  expect(FAMILY_HERO_LAYOUT).toContain("grid");
  expect(FAMILY_HERO_LAYOUT).toContain("min-h-[158px]");
  expect(FAMILY_HERO_LAYOUT).toContain("sm:min-h-[184px]");
  expect(FAMILY_HERO_TEXT).toContain("min-w-0");
 });
 it("shows the complete family illustration without stretching or clipping",()=>{
  render(<FamilyHeroIllustration alt="Family illustration"/>);
  const image=screen.getByRole("img",{name:"Family illustration"});
  expect(image).toHaveAttribute("src",expect.stringContaining("landing-family-characters.avif"));
  expect(image.className).toContain("object-contain");
  expect(image.className).toContain("h-auto");
  expect(image.className).toContain("max-h-[136px]");
  expect(image.className).not.toContain("object-cover");
  expect(image.className).not.toContain("absolute");
 });
 it("shares the same treatment on Today, Money and What Parents Say",()=>{
  for(const path of [
   "../components/AdventureFamilyHome.tsx",
   "../components/FamilyMoneyRhythm.tsx",
   "../routes/what-parents-say.tsx"
  ]){
   const page=source(path);
   expect(page).toContain("<FamilyHeroIllustration");
   expect(page).toContain("FAMILY_HERO_LAYOUT");
   expect(page).not.toContain("<img");
   expect(page).not.toContain("bottom-[-12px]");
  }
 });
 it("does not crop marketplace photos uploaded by families",()=>{
  const market=source("../routes/finds.tsx");
  expect(market).toContain("Selected item photo");
  expect(market.match(/object-contain/g)).toHaveLength(2);
  expect(market).not.toContain("object-cover");
 });
});
