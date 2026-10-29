import {describe,expect,it} from "vitest";
import {sampleMembers,type Member} from "./money";
import {knownChildAges,PLAY_CATEGORIES,playWeekIndex,weeklyPlaySelection} from "./weeklyPlay";

const child=(id:string,ageYears:number):Member=>({id,name:"Child "+id,role:"child",ageGroup:"",prefs:"",ageYears});
describe("read-only, weekly Today play selection",()=>{
 it("offers exactly three category-balanced games and keeps them unchanged through the week",()=>{
  const members=[child("a",3),child("b",5)];
  const thursday=weeklyPlaySelection(members,new Date(2026,9,29,9));
  const sunday=weeklyPlaySelection(members,new Date(2026,10,1,20));
  expect(thursday.map(g=>g.id)).toEqual(sunday.map(g=>g.id));
  expect(thursday.map(g=>g.category)).toEqual(PLAY_CATEGORIES);
  expect(thursday.every(g=>g.minAge<=3&&g.maxAge>=5)).toBe(true);
  const monday=weeklyPlaySelection(members,new Date(2026,10,2,9));
  expect(monday.map(g=>g.id)).not.toEqual(thursday.map(g=>g.id));
 });
 it("changes week on local Monday, including year transition",()=>{
  expect(playWeekIndex(new Date(2026,11,31,18))).toBe(playWeekIndex(new Date(2027,0,3,11)));
  expect(playWeekIndex(new Date(2027,0,4,11))).toBe(playWeekIndex(new Date(2027,0,3,11))+1);
 });
 it("never infers a real child from starter demo records",()=>{
  expect(knownChildAges(sampleMembers())).toEqual([]);
  const games=weeklyPlaySelection(sampleMembers(),new Date(2026,9,29));
  expect(games.every(g=>g.minAge<=3&&g.maxAge>=6)).toBe(true);
 });
 it("provides baby-friendly supervised games rather than preschool challenges",()=>{
  const games=weeklyPlaySelection([child("baby",0)],new Date(2026,9,29));
  expect(games).toHaveLength(3);
  expect(games.every(g=>g.minAge===0&&g.maxAge>=0)).toBe(true);
 });
 it("does not overwrite or mutate family profiles",()=>{
  const members=[child("a",3),child("b",5)];
  const before=JSON.stringify(members);
  weeklyPlaySelection(members,new Date(2026,9,29));
  expect(JSON.stringify(members)).toBe(before);
 });
});
