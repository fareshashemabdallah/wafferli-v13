import {describe,expect,it} from "vitest";
import {localize,preferredBrowserLanguage} from "./i18n";
import {frenchUI} from "./french";
import {sameParentPlace,type ParentPlace} from "./parentsSay";

describe("regional, independent language preferences",()=>{
 it("suggests a supported device language; does not infer country",()=>{
  expect(preferredBrowserLanguage(["fr-MA","ar-JO"])).toBe("fr");
  expect(preferredBrowserLanguage(["ar-LB","en-US"])).toBe("ar");
  expect(preferredBrowserLanguage(["de-DE"])).toBe("en");
 });
 it("maintains LTR French and Arabic text choices separately",()=>{
  expect(localize("fr","Family","العائلة","Famille")).toBe("Famille");
  expect(localize("ar","Family","العائلة","Famille")).toBe("العائلة");
  expect(frenchUI("Add expense")).toBe("Ajouter une dépense");
  expect(frenchUI("A private family name")).toBe("A private family name");
 });
 it("provides French throughout the principal family, money and review journeys",()=>{
  const interfaceLabels=[
   "A little about our household","Family responsibilities",
   "Who are we planning for?","What are you planning?",
   "Your monthly budget at a glance","Pay full / partial",
   "Monthly Money Report","Where our money goes",
   "Use my own figures","Add an expense",
   "Quick expense entry","Our Market sections",
   "Which moment are you preparing?","Important Family Dates",
   "Language of your written review","Your private parent review",
   "Save private review","This Week's Play",
   "Peekaboo Surprise","Sit close to your child.",
   "Save this one fact","Your family plans, in one place",
   "Privacy and local data controls",
   "Restore a backup on this device"
  ];
  for(const label of interfaceLabels){
    expect(frenchUI(label),label).not.toBe(label);
  }
 });
 it("keeps legacy Jordan reviews visible only in their original market",()=>{
  const legacy:ParentPlace={id:"a",name:"A sample park",area:"Amman",category:"activities",createdAt:"2026-01-01"};
  expect(sameParentPlace(legacy,{...legacy,id:"b",countryCode:"JO"})).toBe(true);
  expect(sameParentPlace(legacy,{...legacy,id:"c",countryCode:"LB"})).toBe(false);
 });
});
