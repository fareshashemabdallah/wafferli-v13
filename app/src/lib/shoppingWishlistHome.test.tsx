import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "@/lib/i18n";
import {ShoppingWishlistHome,wishlistTitle,shoppingThemeColor} from "@/components/ShoppingWishlistHome";
vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a href={to} {...props}>{children}</a>
}));
beforeEach(()=>{localStorage.clear()});
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks()});
const draw=()=>render(<I18nProvider><ShoppingWishlistHome/></I18nProvider>);
describe("Dabberna illustrated family shopping",()=>{
 it("shows Sophia cartoon but no invented product listings or prices",async()=>{
  draw();
  await waitFor(()=>expect(screen.getAllByText("Sophia’s Wishlist").length).toBeGreaterThan(0));
  expect(screen.getByRole("img",{name:/Cartoon illustration of Sophia/})).toHaveAttribute("src",expect.stringContaining("data:image/webp;base64,"));
  expect(screen.getByRole("navigation",{name:"Browse shopping categories"}).querySelectorAll("a")).toHaveLength(6);
  expect(screen.getByText(/No saved wishes in this category yet/)).toBeInTheDocument();
  expect(screen.getByText(/No real family needs saved yet/)).toBeInTheDocument();
  expect(screen.queryByText("JOD 22")).not.toBeInTheDocument();
 });
 it("lets a parent rename the wishlist, then saves it separately from financial data",async()=>{
  draw();
  fireEvent.click(screen.getByRole("button",{name:"Personalize page"}));
  const field=screen.getByRole("textbox",{name:/Name before Wishlist/});
  fireEvent.change(field,{target:{value:"Faris"}});
  await waitFor(()=>expect(screen.getAllByText("Faris’s Wishlist").length).toBeGreaterThan(0));
  expect(JSON.parse(localStorage.getItem("wafferli.v13.shoppingWishlistOwner")??"null")).toBe("Faris");
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
  fireEvent.change(field,{target:{value:""}});
  expect(screen.getAllByText("Family Wishlist").length).toBeGreaterThan(0);
 });
 it("offers color presets including blue and white and a custom color",async()=>{
  draw();
  fireEvent.click(screen.getByRole("button",{name:"Personalize page"}));
  fireEvent.click(screen.getByRole("button",{name:"Blue"}));
  await waitFor(()=>expect(JSON.parse(localStorage.getItem("wafferli.v13.shoppingWishlistTheme")??"null").preset).toBe("blue"));
  fireEvent.click(screen.getByRole("button",{name:"White"}));
  await waitFor(()=>expect(JSON.parse(localStorage.getItem("wafferli.v13.shoppingWishlistTheme")??"null").preset).toBe("white"));
  fireEvent.change(screen.getByLabelText("Custom color"),{target:{value:"#123abc"}});
  await waitFor(()=>expect(JSON.parse(localStorage.getItem("wafferli.v13.shoppingWishlistTheme")??"null")).toEqual({preset:"custom",custom:"#123abc"}));
  expect(shoppingThemeColor({preset:"custom",custom:"invalid"})).toBe("#FF4B91");
 });
 it("adds a real wish without pretending its budget is a retailer price",async()=>{
  draw();
  fireEvent.change(screen.getByRole("textbox",{name:"Wish or item"}),{target:{value:"School backpack"}});
  fireEvent.change(screen.getByRole("spinbutton",{name:/Budget/}),{target:{value:"30"}});
  fireEvent.click(screen.getByRole("button",{name:"Add",exact:true}));
  await waitFor(()=>expect(screen.getByText("School backpack")).toBeInTheDocument());
  expect(screen.getByText("Your budget ceiling: 30 JOD")).toBeInTheDocument();
  expect(screen.getByText("No price recorded or verified")).toBeInTheDocument();
  const saved=JSON.parse(localStorage.getItem("wafferli.v13.familyWishlist")??"[]");
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({name:"School backpack",kind:"children",budgetJod:30,prices:[]});
 });
 it("uses the existing family basket without overwriting financial records",async()=>{
  localStorage.setItem("wafferli.v13.shopping",JSON.stringify([{id:"existing",name:"Milk",qty:1,price:0,done:false}]));
  draw();
  await waitFor(()=>expect(screen.getByText("Milk")).toBeInTheDocument());
  fireEvent.click(screen.getByRole("checkbox",{name:"Got Milk"}));
  await waitFor(()=>expect(JSON.parse(localStorage.getItem("wafferli.v13.shopping")??"[]")[0].done).toBe(true));
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("supports Arabic and name fallback",async()=>{
  localStorage.setItem("wafferli.v13.lang",JSON.stringify("ar"));
  draw();
  await waitFor(()=>expect(screen.getByRole("heading",{name:"قائمة رغبات Sophia",level:1})).toBeInTheDocument());
  expect(wishlistTitle("",true)).toBe("قائمة رغبات العائلة");
  expect(wishlistTitle("Mira",false)).toBe("Mira’s Wishlist");
 });
});
