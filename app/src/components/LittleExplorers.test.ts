import {describe,expect,it} from "vitest";
import {memoryRounds} from "@/components/LittleExplorers";

describe("Little Explorers: short-screen memory and offline handoff",()=>{
 it("has exactly three bounded rounds",()=>{
  expect(memoryRounds).toHaveLength(3);
 });
 it("shows the missing object before hiding it and offers one correct answer",()=>{
  for(const round of memoryRounds){
   expect(round.visible).toContain(round.missing);
   expect(new Set(round.visible).size).toBe(round.visible.length);
   expect(round.choices).toHaveLength(3);
   expect(new Set(round.choices).size).toBe(3);
   expect(round.choices.filter(choice=>choice===round.missing)).toHaveLength(1);
  }
 });
 it("increases observation challenge gently",()=>{
  expect(memoryRounds.map(round=>round.visible.length)).toEqual([4,4,5]);
 });
});
