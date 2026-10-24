import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import type {ReactNode} from "react";
import {render,screen,fireEvent,waitFor,cleanup} from "@testing-library/react";
import {I18nProvider} from "@/lib/i18n";
import {FamilyTasksPanel} from "@/components/FamilyTasksPanel";
import type {FamilyTask} from "@/lib/familyTasks";
const wrapper=(ui:ReactNode)=>render(<I18nProvider>{ui}</I18nProvider>);
beforeEach(()=>{
 window.localStorage.clear();
 vi.spyOn(window,"confirm").mockReturnValue(true);
});
afterEach(()=>{cleanup();vi.restoreAllMocks();window.localStorage.clear();});
describe("parent-facing locally stored interactions",()=>{
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

});
