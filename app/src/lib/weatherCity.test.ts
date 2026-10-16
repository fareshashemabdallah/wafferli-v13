import {describe,expect,it} from "vitest";
import {preferredWeatherCity} from "./weatherCity";
describe("parent-controlled weather defaults",()=>{
 it("prefills only named, supported cities explicitly entered in family preferences",()=>{
  expect(preferredWeatherCity("Amman","")).toBe("Amman");
  expect(preferredWeatherCity("Amman, Jordan","")).toBe("Amman");
  expect(preferredWeatherCity("عمّان","")).toBe("Amman");
  expect(preferredWeatherCity("اربد","")).toBe("Irbid");
  expect(preferredWeatherCity("Aqaba, Jordan","")).toBe("Aqaba");
 });
 it("respects a manual weather selection and does not guess unsupported locations",()=>{
  expect(preferredWeatherCity("Amman","Zarqa")).toBe("Zarqa");
  expect(preferredWeatherCity("","")).toBe("");
  expect(preferredWeatherCity("Salt","")).toBe("");
  expect(preferredWeatherCity("New Amman City","")).toBe("");
 });
});
