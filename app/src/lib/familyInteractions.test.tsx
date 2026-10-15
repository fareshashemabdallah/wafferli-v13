import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import type {ReactNode} from "react";
import {render,screen,fireEvent,waitFor,cleanup} from "@testing-library/react";
import {I18nProvider} from "@/lib/i18n";
import {FamilyWishlistPanel} from "@/components/FamilyWishlistPanel";
import {FamilyTasksPanel} from "@/components/FamilyTasksPanel";
import {ChildAwareOutingCompare} from "@/components/ChildAwareOutingCompare";
import type {WishlistItem} from "@/lib/familyWishlist";
import type {FamilyTask} from "@/lib/familyTasks";
const wrapper=(ui:ReactNode)=>render(<I18nProvider>{ui}</I18nProvider>);
beforeEach(()=>{
 window.localStorage.clear();
 vi.spyOn(window,"confirm").mockReturnValue(true);
});
afterEach(()=>{cleanup();vi.restoreAllMocks();window.localStorage.clear();});
describe("parent-facing locally stored interactions",()=>{
 it("creates a gift, records a manually checked price and makes no payment or expenses",async()=>{
  wrapper(<FamilyWishlistPanel mode="gifts"/>);
  await screen.findByText("Gift and occasion wishlist");
  fireEvent.change(screen.getByLabelText("What do you need?"),{target:{value:"Birthday puzzle"}});
  fireEvent.click(screen.getByRole("button",{name:"Add to wishlist"}));
  await screen.findByText("Birthday puzzle");
  let data=JSON.parse(window.localStorage.getItem("wafferli.v13.familyWishlist")??"[]") as WishlistItem[];
  expect(data).toHaveLength(1);
  expect(data[0]?.prices).toEqual([]);
  fireEvent.click(screen.getByRole("button",{name:"Record a price you checked"}));
  fireEvent.change(screen.getByLabelText("Total price JOD"),{target:{value:"24.75"}});
  fireEvent.change(screen.getByLabelText("Store or source"),{target:{value:"Shop A"}});
  fireEvent.click(screen.getByRole("button",{name:"Save price check"}));
  await waitFor(()=>{
   data=JSON.parse(window.localStorage.getItem("wafferli.v13.familyWishlist")??"[]") as WishlistItem[];
   expect(data[0]?.prices).toHaveLength(1);
  });
  expect(data[0]?.prices[0]?.amountJod).toBe(24.75);
  expect(window.localStorage.getItem("wafferli.v13.money")).toBeNull();
  expect(window.localStorage.getItem("wafferli.v13.privateQuoteRequests")).toBeNull();
 });

 it("moves a monthly household item to its next due date after manual confirmation",async()=>{
  const anchorDate=new Date();
  const firstDate=[anchorDate.getFullYear(),String(anchorDate.getMonth()+1).padStart(2,"0"),
   String(anchorDate.getDate()).padStart(2,"0")].join("-");
  wrapper(<FamilyWishlistPanel mode="shopping"/>);
  await screen.findByText("Upcoming family purchase wishlist");
  fireEvent.change(screen.getByLabelText("What do you need?"),{target:{value:"Laundry detergent"}});
  fireEvent.change(screen.getByLabelText("Needed by (optional)"),{target:{value:firstDate}});
  fireEvent.change(screen.getByLabelText("Repeat planning reminder (optional)"),{target:{value:"1"}});
  fireEvent.click(screen.getByRole("button",{name:"Add to wishlist"}));
  await screen.findByText("Laundry detergent");
  fireEvent.click(screen.getByRole("button",{name:"Bought this cycle — schedule next"}));
  await waitFor(()=>{
   const rows=JSON.parse(window.localStorage.getItem("wafferli.v13.familyWishlist")??"[]") as WishlistItem[];
   expect(rows).toHaveLength(1);
   expect(rows[0]?.id).toBeDefined();
   expect(rows[0]?.targetDate).not.toBe(firstDate);
   expect(rows[0]?.status).toBe("considering");
   expect(rows[0]?.lastPurchasedOn).toBe(firstDate);
  });
  expect(window.localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("creates and completes a responsibility locally, without sending an assignment",async()=>{
  wrapper(<FamilyTasksPanel/>);
  await screen.findByText("Family responsibilities");
  fireEvent.change(screen.getByLabelText("Task"),{target:{value:"Prepare children’s school bags"}});
  fireEvent.click(screen.getByRole("button",{name:"Add task"}));
  await screen.findByText("Prepare children’s school bags");
  let tasks=JSON.parse(window.localStorage.getItem("wafferli.v13.familyTasks")??"[]") as FamilyTask[];
  expect(tasks).toHaveLength(1);
  expect(tasks[0]?.status).toBe("open");
  fireEvent.click(screen.getByRole("button",{name:"Toggle task completion"}));
  await waitFor(()=>{
   tasks=JSON.parse(window.localStorage.getItem("wafferli.v13.familyTasks")??"[]") as FamilyTask[];
   expect(tasks[0]?.status).toBe("done");
  });
  expect(window.localStorage.getItem("wafferli.v13.householdMembers")).toBeNull();
  expect(window.localStorage.getItem("wafferli.v13.money")).toBeNull();
 });
 it("shows child-aware outing checks without creating a group vote",async()=>{
  wrapper(<ChildAwareOutingCompare childrenAttendance="yes" ages={["3-5"]}
   stroller={true} quiet={true} maximum="60" city="Amman" preferredDistance={12}/>);
  await screen.findByText("Compare outing options for your family's needs");
  expect(screen.getByText(/Check real weather alerts/)).toBeInTheDocument();
  expect(window.localStorage.getItem("wafferli.v13.outings")).toBeNull();
  expect(window.localStorage.getItem("wafferli.v13.privateOutingOptions")).toBeNull();
 });
 it("renders Arabic gift planning without switching stored family data",async()=>{
  window.localStorage.setItem("wafferli.v13.lang",JSON.stringify("ar"));
  wrapper(<FamilyWishlistPanel mode="gifts"/>);
  await screen.findByText("قائمة الهدايا والمناسبات");
  expect(document.documentElement.dir).toBe("rtl");
  expect(window.localStorage.getItem("wafferli.v13.familyWishlist")).toBeNull();
 });
});
