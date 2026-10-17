import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import type {AnchorHTMLAttributes,ReactNode} from "react";
import {I18nProvider} from "@/lib/i18n";
import {ShoppingReferenceDashboard} from "@/components/ShoppingReferenceDashboard";
import {ShoppingExperienceShell} from "@/components/ShoppingExperienceShell";
import {validateCartoonPhoto} from "@/lib/shoppingCartoon";
vi.mock("@tanstack/react-router",()=>({
 Link:({to,children,...props}:{to:string;children?:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>)=>
 <a href={to} {...props}>{children}</a>
}));
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks()});
const draw=()=>render(<I18nProvider><ShoppingReferenceDashboard/></I18nProvider>);
describe("shopping design reference and local cartoon editor",()=>{
 it("matches visual structure without suggesting fabricated verified offers",async()=>{
  draw();
  expect(screen.getByRole("heading",{level:1})).toHaveTextContent(/Shopping.*Wishlist/);
  expect(screen.getAllByText("Sophia’s Wishlist").length).toBeGreaterThan(0);
  expect(screen.getByRole("img",{name:/Cartoon of Sophia/})).toBeInTheDocument();
  expect(screen.getByRole("navigation",{name:"Shopping categories"}).querySelectorAll("a")).toHaveLength(6);
  expect(screen.getByRole("group",{name:"Wishlist filters"}).querySelectorAll("button")).toHaveLength(7);
  expect(screen.getByText(/Ideas to explore — not personalized AI research/)).toBeInTheDocument();
  await waitFor(()=>expect(screen.getByText(/No matching saved items yet/)).toBeInTheDocument());
  expect(screen.queryByText("JOD 22")).not.toBeInTheDocument();
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("updates name and theme independently of existing family and financial data",async()=>{
  draw();
  fireEvent.click(screen.getByRole("button",{name:"Change Theme & Picture"}));
  const name=screen.getByRole("textbox",{name:"Name before Wishlist"});
  fireEvent.change(name,{target:{value:"Faris"}});
  await waitFor(()=>expect(screen.getAllByText("Faris’s Wishlist").length).toBeGreaterThan(0));
  fireEvent.click(screen.getByRole("button",{name:"Blue"}));
  await waitFor(()=>expect(JSON.parse(localStorage.getItem("wafferli.v13.shoppingWishlistTheme")??"null").preset).toBe("blue"));
  expect(JSON.parse(localStorage.getItem("wafferli.v13.shoppingWishlistOwner")??"null")).toBe("Faris");
  expect(localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("allows safely selecting and applying a saved cartoon, and resetting to Sophia",async()=>{
  const sample="data:image/webp;base64,UklGRg==";
  localStorage.setItem("wafferli.v13.shoppingWishlistCartoon",JSON.stringify(sample));
  draw();
  await waitFor(()=>expect(screen.getByRole("img",{name:"Your selected cartoon-style portrait"})).toHaveAttribute("src",sample));
  fireEvent.click(screen.getByRole("button",{name:"Change Theme & Picture"}));
  fireEvent.click(screen.getByRole("button",{name:"Reset to Sophia"}));
  await waitFor(()=>expect(screen.getByRole("img",{name:/Cartoon of Sophia/})).toBeInTheDocument());
  expect(JSON.parse(localStorage.getItem("wafferli.v13.shoppingWishlistCartoon")??"null")).toBe("");
 });
 it("rejects non-image uploads and oversized images without storing original photos",()=>{
  expect(validateCartoonPhoto(new File(["<svg/>"],"avatar.svg",{type:"image/svg+xml"}))).toBe("format");
  expect(validateCartoonPhoto({type:"image/jpeg",size:8*1024*1024+1})).toBe("size");
  expect(validateCartoonPhoto({type:"image/png",size:2*1024*1024})).toBeNull();
  draw();
  fireEvent.click(screen.getByRole("button",{name:"Change Theme & Picture"}));
  fireEvent.change(screen.getByLabelText("Upload photo for cartoon"),{target:{files:[new File(["<svg/>"],"avatar.svg",{type:"image/svg+xml"})]}});
  expect(screen.getByRole("alert")).toHaveTextContent("Choose a JPEG");
  expect(localStorage.getItem("wafferli.v13.shoppingWishlistCartoon")).toBeNull();
 });
 it("uses real shared wishlist and basket data and meaningful filters",async()=>{
  draw();
  fireEvent.change(screen.getByRole("textbox",{name:"Add a wish"}),{target:{value:"Story book"}});
  fireEvent.click(screen.getByRole("button",{name:/^Add$/}));
  await waitFor(()=>expect(screen.getByText("Story book")).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button",{name:/Books & Learning/}));
  expect(screen.getByText("Story book")).toBeInTheDocument();
  fireEvent.change(screen.getByRole("textbox",{name:"New family need"}),{target:{value:"Milk"}});
  fireEvent.click(screen.getByRole("button",{name:"Add family need"}));
  await waitFor(()=>expect(screen.getByText("Milk")).toBeInTheDocument());
  expect(JSON.parse(localStorage.getItem("wafferli.v13.familyWishlist")??"[]")).toHaveLength(1);
  expect(JSON.parse(localStorage.getItem("wafferli.v13.shopping")??"[]")).toHaveLength(1);
 });
 it("presents four accessible family navigation choices, without sample people",()=>{
  render(<I18nProvider><ShoppingExperienceShell><p>Reference shopping content</p></ShoppingExperienceShell></I18nProvider>);
  const navs=screen.getAllByRole("navigation",{name:"Main"});
  expect(navs).toHaveLength(2);
  for(const nav of navs)expect(nav.querySelectorAll("a")).toHaveLength(4);
  expect(screen.getByRole("link",{name:"Family & settings"})).toHaveAttribute("href","/space");
  expect(screen.queryByRole("navigation",{name:"Related family actions"})).not.toBeInTheDocument();
  expect(screen.queryByText("All Family")).not.toBeInTheDocument();
  expect(screen.queryByText("Partner (sample)")).not.toBeInTheDocument();
 });
});
