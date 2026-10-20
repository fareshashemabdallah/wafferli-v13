import { HouseholdPresencePanel } from "@/components/HouseholdPresencePanel";
import { createFileRoute } from "@tanstack/react-router";
import { CashFlowPlanner } from "@/components/CashFlowPlanner";
import { MoneyGuidance } from "@/components/MoneyGuidance";
import {reverseVarianceAllocation} from "@/lib/financeAlignment";
import { MoneyOverviewPanel } from "@/components/MoneyOverviewPanel";
import {emptyRealMoney} from "@/lib/moneyOverview";
import {FinancialIntelligencePanel} from "@/components/FinancialIntelligencePanel";
import { localToday } from "@/lib/cashflow";
import { Pencil, Plus, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AppShell, PilotBadge } from "@/components/AppShell";
import { Field, NativeSelect, inputCls } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { computeMoney, sampleMembers, sampleMoney, type CatType, type Category, type Expense, type Member } from "@/lib/money";
import { fmtJOD, parseAmount, uid, useLocalState } from "@/lib/storage";
import {categoryItemTotal,type BudgetItem} from "@/lib/householdBudgetBuilder";

export const Route = createFileRoute("/money")({
  head: () => ({
    meta: [
      { title: "Our Finances — Dabberna" },
      { name: "description", content: "Plan your household budget, log expenses and see your real remaining allowance and savings projection." },
      { property: "og:title", content: "Our Finances — Dabberna" },
      { property: "og:description", content: "Household budget, actual spending and savings projection." },
    ],
  }),
  component: MoneyPage,
});

const today = localToday;

function MoneyPage() {
  const { tr } = useI18n();
  const { lang } = useI18n();
  const ar=lang==="ar";
  const [section,setSection]=useState<"overview"|"spending"|"planning">("overview");
  const [categoryEditorOpen,setCategoryEditorOpen]=useState(false);
  const [incomeEditorOpen,setIncomeEditorOpen]=useState(false);
  const [categoryNavigationRequest,setCategoryNavigationRequest]=useState(0);
  const categoryEditorRef=useRef<HTMLDetailsElement>(null);
  const [s, setS, ready] = useLocalState("money", sampleMoney());
  const [members] = useLocalState<Member[]>("members", sampleMembers());
  const c = useMemo(() => computeMoney(s), [s]);
  const recurringSavingsGoal=s.savingsTargetAmount??Math.round(c.monthlyIncome*s.savingsPct)/100;
  const openCategoryEditor=()=>{
    setSection("overview");
    setCategoryEditorOpen(true);
    // Increment even when already open so repeated taps navigate reliably.
    setCategoryNavigationRequest(n=>n+1);
  };
  useEffect(()=>{
    if(!ready||!categoryNavigationRequest||section!=="overview")return;
    const editor=categoryEditorRef.current;
    editor?.scrollIntoView?.({behavior:"smooth",block:"start"});
    editor?.querySelector("summary")?.focus({preventScroll:true});
  },[ready,section,categoryNavigationRequest]);

  if (!ready)
    return (
      <AppShell title={tr("Our Finances")}>
        <div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      </AppShell>
    );

  const upd = (p: Partial<typeof s>) => setS((prev) => ({ ...prev, ...p, demo: prev.demo }));

  return (
    <AppShell title={tr("Our Finances")}>
      
      <div role="tablist" aria-label={ar?"أقسام المالية":"Money sections"} className="mb-3 grid grid-cols-3 gap-1 rounded-[1.25rem] border border-[#CFE4D8] bg-[#E5F3E6] p-1.5">
        {([{id:"overview",en:"Our Money",ar:"مال العيلة",icon:"🏡"},{id:"spending",en:"Spending",ar:"المصاريف",icon:"🛍️"},{id:"planning",en:"Bills",ar:"الفواتير",icon:"📅"}] as const)
          .map(v=><button role="tab" aria-selected={section===v.id} key={v.id} type="button" onClick={()=>setSection(v.id)}
            className={"flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-1 text-xs font-bold transition sm:text-sm "+(section===v.id?"bg-white text-[#227355] shadow-sm":"text-[#59786A] hover:bg-white/60")}><span aria-hidden="true">{v.icon}</span>{ar?v.ar:v.en}</button>)}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {s.demo && <PilotBadge>{tr("Demo data")}</PilotBadge>}
        <span className="text-xs text-muted-foreground">{tr("Saved on this device only. Use fictional figures during the pilot.")}</span>
        <details className="ms-auto"><summary className="cursor-pointer text-xs font-medium text-muted-foreground">Settings / إعدادات</summary>
        <div className="mt-2">        <Button
          variant="outline"
          size="sm"
          className="ms-auto"
          onClick={() => {
            if (confirm(tr("Reset all money data to the demo sample?"))) {
              setS(sampleMoney());
              toast.success(tr("Sample data restored"));
            }
          }}
        >
          <RotateCcw className="size-4" /> {tr("Reset sample data")} </Button>
        </div></details>
      </div>

      {section==="overview"&&<MoneyOverviewPanel state={s} setState={setS} goTo={setSection}
        onManageCategories={openCategoryEditor}
        onEditIncome={()=>{setIncomeEditorOpen(true);setSection("overview");}}
        householdPanel={<HouseholdPresencePanel members={members} money={s} setMoney={setS}/>}
        budgetManagement={<div id="money-budget-controls">
          <details ref={categoryEditorRef} open={categoryEditorOpen} onToggle={event=>setCategoryEditorOpen(event.currentTarget.open)} className="editorial-card scroll-mt-4 px-4 py-3">
            <summary className="min-h-11 cursor-pointer text-sm font-semibold text-brand">{ar?"أضف وعدّل فئات ميزانيتك":"Add or edit budget categories"}</summary>
            <p className="mt-2 text-xs text-muted-foreground">{ar?"المخصصات الشهرية ليست مصاريف مدفوعة ولا مواعيد فواتير.":"Category allocations are monthly plans, not paid transactions or dated bills."}</p>
            <Categories cats={s.categories} budgetItems={s.budgetItems??[]} spentBy={c.spentBy} plannedBy={c.plannedBy} onChange={categories=>upd({categories,budgetItems:(s.budgetItems??[]).filter(item=>categories.some(cat=>cat.id===item.categoryId))})}/>
            {!s.demo&&s.financialInputsPartial===true&&<div className="mt-4 rounded-xl border border-[#D5E4D2] bg-[#F6FAF5] p-3">
             <p className="text-sm font-semibold">{ar?"هل هذه الفئات تغطي مصاريف البيت المعتادة؟":"Do these categories cover your regular household costs?"}</p>
             <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?
              "أدخلت أرقاماً جزئية. لن تعرض دبّرنا مبلغاً متاحاً من الميزانية حتى تراجع كافة المصاريف الأساسية والمهمة. إذا ناقص شيء أضفه أولاً.":
              "You started with partial figures. Dabberna will not suggest that the remaining budget is available until you've reviewed essential and important costs. Add missing categories first."}</p>
             <button type="button" className="mt-3 min-h-11 rounded-full border border-[#B8DAC2] bg-white px-4 text-xs font-bold text-brand"
              onClick={()=>{if(window.confirm(ar?
               "هل راجعت المصاريف الشهرية المعتادة وتؤكد أن الفئات تغطيها قدر الإمكان؟ لا يتأكد رصيد البنك بهذه الخطوة.":
               "Have you reviewed regular monthly household costs and believe the categories cover them? This does not verify your bank balance."))setS(old=>({...old,financialInputsPartial:false}));}}>
              {ar?"راجعت المصاريف المعتادة":"I've reviewed our regular costs"}
             </button>
            </div>}
          </details>
          <details open={incomeEditorOpen} onToggle={event=>setIncomeEditorOpen(event.currentTarget.open)} className="editorial-card mt-3 px-4 py-3">
            <summary className="min-h-11 cursor-pointer text-sm font-semibold text-brand">{ar?"الدخل الشهري وهدف الادخار (اختياري)":"Monthly income & savings goal (optional)"}</summary>
            <Settings key={`${c.monthlyIncome}:${recurringSavingsGoal}`} income={c.monthlyIncome} target={recurringSavingsGoal} hasSources={!!s.incomeSources?.length}
              onSave={(income,savingsTargetAmount)=>upd(s.incomeSources===undefined?{income,savingsTargetAmount}:{savingsTargetAmount})}/>
          </details>
        </div>}/>}

      {section==="overview"&&<details className="editorial-card mb-4 px-4 py-3">
       <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-brand">
        {ar?"أدوات إضافية: تاريخ المصاريف وتجربة خطط مستقبلية":"Optional: spending history and future budget experiments"} +
       </summary>
       <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?
        "هذه أدوات لمن يحب التفاصيل. ما تحتاجها لتفهم ميزانية بيتك اليوم.":
        "These deeper tools are for parents who want more analysis. You don't need them to understand today's household budget."}</p>
       <div className="mt-3"><FinancialIntelligencePanel state={s}/></div>
      </details>}
      {section==="planning"&&<>
      <div className="mb-4"><h2 className="text-xl font-semibold">{ar?"الفواتير والدفعات":"Your bills & payments"}</h2>
       <p className="mt-1 text-sm text-muted-foreground">{ar?"سجّل موعد الاستحقاق مرة واحدة، وبعد الدفع أكّد المبلغ الحقيقي. لإدخال مشترياتك اليومية، استخدم المصاريف.":"Add each bill once with its due date, then confirm the payment when it happens. Use Spending for everyday purchases."}</p></div>
      <CashFlowPlanner state={s} members={members} update={setS} />
      </>}
      {section==="spending"&&<>
      <div className="mb-4"><h2 className="text-xl font-semibold">{ar?"سجّل اللي دفعته":"Record what you spent"}</h2>
       <p className="mt-1 text-sm text-muted-foreground">{ar?"سجّل المصروف اليومي مرة واحدة. الفواتير المتكررة ومواعيد الدفع تجدها بقسم الفواتير.":"Add everyday purchases here. For rent, tuition or other payments with due dates, use Bills instead."}</p>
       <button type="button" className="mt-2 text-sm font-semibold text-brand underline underline-offset-2" onClick={()=>setSection("planning")}>{ar?"عندي فاتورة أو دفعة قادمة":"I have an upcoming bill or payment"} →</button>
      </div>
      {(s.demo||s.categories.length===0)&&<div className="mb-4 rounded-xl border border-[#DBE5D8] bg-[#F2F7EF] p-4">
        <p className="text-sm font-semibold">{ar?"ابدأ بمصروف واحد، حتى بلا ميزانية":"Record one actual expense, even without a budget"}</p>
        <p className="mt-1 text-xs text-muted-foreground">{ar?
         "اختَر وين بدك تسجّل المصروف. المبلغ بتدخله بعدين؛ ما بدك تكمّل ميزانية ولا تدخل دخل. الأرقام التجريبية رح تختفي فقط بعد موافقتك.":
         "You can record an actual purchase without entering income or creating a category. Missing budget amounts remain unknown. Demo finance is replaced only with your permission."}</p>
        {s.demo&&<button type="button" className="mt-3 min-h-11 rounded-full bg-brand px-4 text-sm font-semibold text-white" onClick={()=>{
          if(window.confirm(ar?"بدك تبدأ تسجيل مصاريف حقيقية؟ رح نستبدل أرقام المال التجريبية فقط ونحافظ على ملف العيلة والخطط.":"Start recording real spending? This replaces demo Money figures only. Family profiles, plans and calendar stay unchanged."))setS(current=>current.demo?emptyRealMoney():current);
        }}>{ar?"ابدأ بأول مصروف مدفوع":"Start with my first paid expense"}</button>}
        <details className="mt-3"><summary className="min-h-10 cursor-pointer text-xs font-semibold text-brand">{ar?"اختياري: أنشئ فئة للميزانية":"Optional: organize a budget category"}</summary>
        <div className="mt-3 flex flex-wrap gap-2">
         {([{id:"groceries",en:"Groceries",ar:"البقالة"},{id:"transport",en:"Transport",ar:"المواصلات"},
           {id:"education",en:"Education",ar:"التعليم"},{id:"health",en:"Healthcare",ar:"الصحة"},
           {id:"household",en:"Household",ar:"البيت"},{id:"other",en:"Other",ar:"أخرى"}] as const)
          .map(item=><button type="button" key={item.id} className="min-h-11 rounded-full border border-[#BFD9C6] bg-white px-3 text-xs font-semibold text-brand"
           onClick={()=>{
            if(s.demo&&!window.confirm(ar?"تبدأ سجلات مصاريف العيلة؟ سنزيل أرقام المالية التجريبية فقط، ونحافظ على العيلة والخطط.":"Start real Money records? Only example Money figures will be removed; your family profiles and plans remain."))return;
            setS(previous=>{
             const base=previous.demo?emptyRealMoney():previous;
             const id="quick-"+item.id;
             if(base.categories.some(cat=>cat.id===id))return base;
             return {...base,categories:[...base.categories,{id,name:item.en,type:"variable",planned:0,amountConfidence:"estimate"}]};
            });
           }}>{ar?item.ar:item.en}</button>)}
        </div></details>
       </div>}
            <Expenses
        demo={s.demo}
        cats={s.categories}
        members={members}
        budgetItems={s.budgetItems??[]}
        expenses={s.expenses}
        onChange={(expenses) => upd({ expenses })}
        onRecord={(entry)=>setS(previous=>{
          if(previous.demo||previous.expenses.some(e=>e.id===entry.id)||
            !(entry.categoryId==="uncategorized"||previous.categories.some(c=>c.id===entry.categoryId)))return previous;
          return {...previous,expenses:[entry,...previous.expenses],
            ...(previous.categories.length===0?{financialInputsPartial:true}:{})};
        })}
        cashBalance={s.cashOnHand??null}
        onConfirmPlanned={(expenseId,amount,mode)=>setS(prev=>{
          if(mode==="deduct"&&(prev.cashOnHand==null||prev.cashOnHand<amount))return prev;
          return {...prev,expenses:prev.expenses.map(e=>e.id===expenseId?{...e,amount,status:"paid" as const,
            date:today(),plannedAmount:e.plannedAmount??e.amount,cashDeducted:mode==="deduct"}:e),
            ...(mode==="deduct"&&prev.cashOnHand!=null?{cashOnHand:Math.round((prev.cashOnHand-amount)*100)/100,cashUpdatedAt:today()}:{})};
        })}
        onDelete={(expense)=>{
          const restoreCash=!!expense.cashDeducted&&s.cashOnHand!==null&&s.cashOnHand!==undefined&&window.confirm(ar?"هل تريد إعادة المبلغ الذي خُصم من الرصيد عند حذف المصروف؟":"Restore the cash deducted for this expense when deleting it?");
          if(!window.confirm(restoreCash?(ar?"تأكيد حذف المصروف وإعادة الرصيد؟":"Delete expense and restore cash?"):(ar?"حذف المصروف دون تغيير رصيد البنك؟":"Delete this expense without changing entered cash?")))return;
          setS(previous=>{
          const base=reverseVarianceAllocation(previous,expense.id);
          if(expense.allocation&&base===previous)return previous;
          const expenses=base.expenses.filter(e=>e.id!==expense.id);
          if(!expense.billId || !expense.dueDate)return {...base,expenses,...(restoreCash&&base.cashOnHand!=null?{cashOnHand:Math.round((base.cashOnHand+expense.amount)*100)/100,cashUpdatedAt:today()}:{})};
          const commitments=(base.commitments??[]).map(b=>b.id===expense.billId?{
            ...b,paidDates:(b.paidDates??[]).filter(d=>d!==expense.dueDate)
          }:b);
          return {...base,expenses,commitments};
        });
        }}
      />
      <details className="editorial-card mt-4 px-4 py-3">
        <summary className="min-h-10 cursor-pointer text-sm font-semibold text-brand">{ar?"راجع الفروقات بين المخطط والمدفوع (اختياري)":"Review budget differences (optional)"}</summary>
        <MoneyGuidance scope="variance" state={s} setState={setS}/>
      </details>
      </>}
    </AppShell>
  );
}

function Stat({ label, value, sub, warn }: { label: string; value: string; sub: string; warn?: boolean }) {
  const { tr } = useI18n();
  return (
    <div className="card-soft p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      <p className={`text-xs ${warn ? "font-semibold text-destructive" : "text-muted-foreground"}`}>{sub}</p>
    </div>
  );
}

function Settings({income,target,hasSources,onSave}:{income:number;target:number;hasSources:boolean;onSave:(income:number,target:number)=>void}){
 const {lang}=useI18n(),ar=lang==="ar";
 const [inc,setInc]=useState(String(income)),[goal,setGoal]=useState(String(target)),[err,setErr]=useState("");
 const save=(e:FormEvent)=>{
   e.preventDefault();
   const i=hasSources?income:Number(inc),amount=Number(goal);
   if(!Number.isFinite(i)||i<0||i>100000)return setErr(ar?"أدخل دخلاً صحيحاً.":"Enter a valid monthly income.");
   if(!Number.isFinite(amount)||amount<0||amount>100000)return setErr(ar?"أدخل هدف ادخار صحيحاً.":"Enter a valid savings goal.");
   setErr("");onSave(i,Math.round(amount*100)/100);
   toast.success(ar?"تم تحديث الدخل وهدف الادخار.":"Income and savings goal updated.");
 };
 return <section className="mt-4">
  <p className="text-xs text-muted-foreground">{ar?"حدّد هدف الادخار المعتاد كل شهر بالدينار. إعادة التوزيع لمصروف محدد تؤثر فقط على شهر الدفع.":"Set your regular monthly savings goal in JOD. One-off reallocations affect only their payment month."}</p>
  <form onSubmit={save} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
   <Field label={ar?"الدخل الشهري (د.أ)":"Monthly income (JOD)"}>
    <Input inputMode="decimal" className={inputCls} disabled={hasSources} value={hasSources?String(income):inc} onChange={e=>setInc(e.target.value)}/>
   </Field>
   <Field label={ar?"هدف الادخار شهرياً (د.أ)":"Monthly savings goal (JOD)"}>
    <Input inputMode="decimal" className={inputCls} value={goal} onChange={e=>setGoal(e.target.value)}/>
   </Field>
   <Button type="submit" className="h-11">{ar?"حفظ":"Save"}</Button>
   {hasSources&&<p className="text-xs text-muted-foreground sm:col-span-3">{ar?"تعديل مصدر الدخل من قائمة الدخل أعلاه.":"Edit monthly income through the Income schedule above."}</p>}
  </form>
  {err&&<p className="mt-2 text-sm text-destructive" role="alert">{err}</p>}
 </section>;
}

const typeLabel: Record<CatType, string> = { fixed: "Fixed", variable: "Variable", periodic: "Periodic" };

function Categories({ cats, budgetItems, spentBy, plannedBy, onChange }: { cats: Category[]; budgetItems:BudgetItem[]; spentBy: (id: string) => number; plannedBy:(id:string)=>number; onChange: (c: Category[]) => void }) {
  const { tr,lang } = useI18n();
  const [editing, setEditing] = useState<Category | null>(null);
  return (
    <section className="card-soft mt-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{tr("Spending categories")}</h2>
        <Button size="sm" variant="secondary" onClick={() => setEditing({ id: "", name: "", type: "variable", planned: 0 })}>
          <Plus className="size-4" /> {tr("Add")} </Button>
      </div>
      {editing && (
        <CategoryForm
          initial={editing}
          minimumAllocation={editing.id?categoryItemTotal(budgetItems,editing.id):0}
          onCancel={() => setEditing(null)}
          onSave={(cat) => {
            onChange(cat.id && cats.some((c) => c.id === cat.id) ? cats.map((c) => (c.id === cat.id ? cat : c)) : [...cats, { ...cat, id: uid() }]);
            setEditing(null);
          }}
        />
      )}
      {cats.length === 0 && <p className="mt-3 text-sm text-muted-foreground">{tr("No categories yet. Add your first one.")}</p>}
      <ul className="mt-3 divide-y">
        {cats.map((c) => {
          const a = spentBy(c.id);
          const effective=plannedBy(c.id);
          const pct = effective ? Math.min(100, (a / effective) * 100) : 0;
          return (
            <li key={c.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{tr(c.name)}</span>
                  <span className="rounded-full bg-mint px-2 text-[11px] text-brand">{tr(typeLabel[c.type])}</span>
                  {c.priority&&<span className="rounded-full border px-2 text-[11px] text-muted-foreground">{c.priority==="essential"?(lang==="ar"?"أساسي":"Essential"):c.priority==="protected"?(lang==="ar"?"مهم للعيلة":"Protected"):(lang==="ar"?"مرن":"Flexible")}</span>}
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${a > effective ? "bg-destructive" : "bg-brand-2"}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{tr("Actual")} {fmtJOD(a)} · {tr("Planned")} {fmtJOD(effective)} {effective!==c.planned&&(lang==="ar"?"(معدل لهذا الشهر)":"(adjusted this month)")}</p>
              </div>
              <Button size="icon" variant="ghost" aria-label={`Edit ${c.name}`} onClick={() => setEditing(c)}><Pencil className="size-4" /></Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Delete ${c.name}`}
                onClick={() => confirm(`${tr("Delete category")} "${c.name}"? ${lang==="ar"?"ستُحذف تفاصيل بنود هذه الفئة. تبقى المدفوعات والفواتير القديمة محفوظة ولكن قد تظهر دون فئة.":"Its detailed budget items will be removed. Existing payments and bills remain saved but may become uncategorized."}`) && onChange(cats.filter((x) => x.id !== c.id))}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CategoryForm({ initial, minimumAllocation, onSave, onCancel }: { initial: Category; minimumAllocation:number; onSave: (c: Category) => void; onCancel: () => void }) {
  const { tr,lang } = useI18n();
  const [name, setName] = useState(initial.name);
  const [type, setType] = useState<CatType>(initial.type);
  const [planned, setPlanned] = useState(initial.planned ? String(initial.planned) : "");
  const [priority,setPriority]=useState<Category["priority"]>(initial.priority);
  const [confirmed,setConfirmed]=useState(initial.amountConfidence==="confirmed");
  const [err, setErr] = useState("");
  return (
    <form
      className="mt-3 grid gap-3 rounded-xl bg-muted p-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const p = planned === "" || planned === "0" ? 0 : parseAmount(planned, 100000);
        if (!name.trim()) return setErr(tr("Name is required."));
        if (p === null) return setErr(tr("Planned amount must be 0 or a positive number."));
        if (p < minimumAllocation) return setErr(lang==="ar"?`البنود المفصلة مجموعها ${fmtJOD(minimumAllocation)}. عدّل البنود أولاً أو حافظ على مخصص يكفيها.`:`Detailed items already total ${fmtJOD(minimumAllocation)}. Reduce them first or keep the category plan at least this high.`);
        const next:Category={...initial,id:initial.id,name:name.trim().slice(0,40),type,planned:p,amountConfidence:confirmed?"confirmed":"estimate"};
        if(priority)next.priority=priority;else delete next.priority;
        onSave(next);
      }}
    >
      <Field label={tr("Name")}><Input className={inputCls} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label={tr("Type")}>
        <NativeSelect value={type} onChange={(e) => setType(e.target.value as CatType)}>
          <option value="fixed">{tr("Fixed (rent, bills)")}</option>
          <option value="variable">{tr("Variable (groceries, fuel)")}</option>
          <option value="periodic">{tr("Periodic (school, insurance)")}</option>
        </NativeSelect>
      </Field>
      <Field label={tr("Planned per month (JOD)")}><Input className={inputCls} inputMode="decimal" value={planned} onChange={(e) => setPlanned(e.target.value)} /></Field>
      <Field label={tr("How important is this spending to your family?")}>
       <NativeSelect value={priority??""} onChange={e=>setPriority(e.target.value===""?undefined:e.target.value as Category["priority"])}>
        <option value="">{tr("Not decided — don't assume")}</option>
        <option value="essential">{tr("Essential — needs to be covered")}</option>
        <option value="protected">{tr("Important to our quality of life")}</option>
        <option value="flexible">{tr("Flexible — open to reviewing")}</option>
       </NativeSelect>
      </Field>
      <p className="text-xs text-muted-foreground sm:col-span-2">{tr("Fixed, variable and periodic describe timing, not importance. Dabberna will only suggest adjustments to categories you explicitly mark flexible.")}</p>
      <label className="flex items-center gap-2 text-xs sm:col-span-2"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>{tr("I have checked this monthly estimate")}</label>
      <div className="flex items-end gap-2">
        <Button type="submit" className="h-11 flex-1">{tr("Save")}</Button>
        <Button type="button" variant="outline" className="h-11" onClick={onCancel}>{tr("Cancel")}</Button>
      </div>
      {err && <p className="text-sm text-destructive sm:col-span-2" role="alert">{err}</p>}
    </form>
  );
}

function Expenses({ cats, demo, members, budgetItems, expenses, onChange, onRecord, onDelete, onConfirmPlanned, cashBalance }: {
  cats: Category[]; demo:boolean; members: Member[]; budgetItems: BudgetItem[]; expenses: Expense[];
  onChange: (e: Expense[]) => void; onRecord:(e:Expense)=>void; onDelete: (e:Expense)=>void;
  onConfirmPlanned:(id:string,actual:number,mode:"already"|"deduct"|"untracked")=>void;
  cashBalance:number|null;
}) {
  const { tr,lang } = useI18n();
  const ar=lang==="ar";
  const blank: Expense = { id: "", date: today(), categoryId: cats[0]?.id ?? "uncategorized", amount: 0, shared: false };
  const [editing, setEditing] = useState<Expense | null>(null);
  const [quickAmount, setQuickAmount] = useState("");
  const [quickExpected,setQuickExpected]=useState("");
  const [quickNote,setQuickNote]=useState("");
  const [showHistory,setShowHistory]=useState(false);
  const [confirming,setConfirming]=useState<string|null>(null);
  const [actualValue,setActualValue]=useState("");
  const [quickCategory, setQuickCategory] = useState(cats[0]?.id ?? "");
  const [quickItem,setQuickItem]=useState("");
  const [quickError, setQuickError] = useState("");
  const [quickRecorded,setQuickRecorded] = useState(false);
  const selectedCategory=cats.some(x=>x.id===quickCategory)?quickCategory:(quickCategory==="uncategorized"?"uncategorized":cats[0]?.id??"uncategorized");
  const matchingItems=budgetItems.filter(i=>i.categoryId===selectedCategory);
  const selectedItem=matchingItems.some(i=>i.id===quickItem)?quickItem:"";
  const recordQuick=(ev:FormEvent)=>{
    ev.preventDefault();
    if(demo||quickRecorded)return setQuickError(ar?"ابدأ بسجلات مالية حقيقية أولاً.":"Start real Money before logging a paid purchase.");
    const amount=parseAmount(quickAmount,50000);
    if(amount===null)return setQuickError(tr("Enter a valid amount greater than zero (up to 50,000 JOD)."));
    if(quickExpected.trim()!==""&&(!Number.isFinite(Number(quickExpected))||Number(quickExpected)<0||Number(quickExpected)>50000))return setQuickError(ar?"أدخل مبلغاً متوقعاً صحيحاً.":"Enter a valid expected amount.");
    if(!selectedCategory)return setQuickError(tr("Add a spending category first."));
    const entry:Expense={id:uid(),date:today(),categoryId:selectedCategory,amount,shared:false,status:"paid",...(selectedItem?{budgetItemId:selectedItem}:{}),...(quickNote.trim()?{note:quickNote.trim().slice(0,60)}:{}),...(quickExpected.trim()?{plannedAmount:Math.round(Number(quickExpected)*100)/100}:{})};
    onRecord(entry);
    setQuickRecorded(true);setQuickError("");
    toast.success(ar?"تم تسجيل المصروف المدفوع.":"Paid expense recorded.");
  };
  const month=today().slice(0,7);
  const sorted=[...expenses].filter(e=>showHistory||e.date.startsWith(month)||e.status==="planned").sort((a,b)=>b.date.localeCompare(a.date));
  const olderCount=expenses.filter(e=>!e.date.startsWith(month)&&e.status!=="planned").length;
  const catName = (id: string) => cats.find((c) => c.id === id)?.name ?? "Uncategorized";
  return (
    <section className="card-soft mt-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{ar?"أضف مصروفاً":"Add an expense"}</h2>
        <Button size="sm" variant="outline" onClick={() => setEditing(blank)} disabled={demo}>
          <Plus className="size-4" /> {ar?"إدخال بتفاصيل أكثر":"Add with more details"} </Button>
      </div>
      <form onSubmit={recordQuick} className="mt-3 grid gap-2 rounded-xl bg-muted/40 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <p className="sm:col-span-3 text-xs text-muted-foreground">{ar?"هذا لتسجيل مصروف تم دفعه بالفعل، وليس فاتورة قادمة.":"For a purchase already paid—not a future bill."}</p>
        <Field label={ar?"كم دفعت؟ (د.أ)":"How much did you pay? (JOD)"}>
          <Input className={inputCls} inputMode="decimal" value={quickAmount}
            placeholder={tr("e.g. 12.50")} onChange={e=>setQuickAmount(e.target.value)} />
        </Field>
        <Field label={tr("Category")}>
          <NativeSelect value={selectedCategory} onChange={e=>{setQuickCategory(e.target.value);setQuickItem("");}}>
            <option value="uncategorized">{ar?"غير مصنف بعد":"Uncategorized for now"}</option>
            {cats.map(cat=><option key={cat.id} value={cat.id}>{tr(cat.name)}</option>)}
          </NativeSelect>
        </Field>
        {matchingItems.length>0&&<Field label={ar?"أي بند؟ (اختياري)":"Which item? (optional)"}>
          <NativeSelect value={selectedItem} onChange={e=>setQuickItem(e.target.value)}>
           <option value="">{ar?"بدون تحديد بند":"Category only"}</option>
           {matchingItems.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}
          </NativeSelect>
         </Field>}
        <Field label={ar?"على شو صرفت؟ (اختياري)":"What was it for? (optional)"}>
          <Input className={inputCls} maxLength={60} value={quickNote} onChange={e=>setQuickNote(e.target.value)} placeholder={ar?"مثلاً: تسوّق أسبوعي":"e.g. weekly groceries"}/>
        </Field>
        <Button type="submit" className="h-11" disabled={demo||quickRecorded||!selectedCategory}><Plus className="size-4"/> {ar?"سجّل المصروف":"Record expense"}</Button>
        {quickRecorded&&<div role="status" className="sm:col-span-3 rounded-xl bg-[#EDF7EB] p-3 text-sm">
          <strong>{ar?"تم تسجيل المصروف مرة واحدة.":"Expense recorded once."}</strong>
          <button type="button" className="ms-3 min-h-10 font-semibold text-brand underline" onClick={()=>{
            setQuickRecorded(false);setQuickAmount("");setQuickExpected("");setQuickNote("");setQuickItem("");setQuickError("");
          }}>{ar?"مصروف جديد":"Add another"}</button>
        </div>}
        <details className="sm:col-span-3 rounded-xl border border-border bg-white p-3">
          <summary className="cursor-pointer text-xs font-semibold text-brand">{ar?"هل المبلغ مختلف عن المتوقع؟ (اختياري)":"Compare with an expected amount (optional)"} +</summary>
          <label className="mt-2 block text-xs font-medium">{ar?"كم كنت تتوقع أن تدفع؟ (د.أ)":"What did you expect to pay? (JOD)"}
            <Input type="number" step=".01" min={0} max={50000} className="mt-1 max-w-44" value={quickExpected} onChange={e=>setQuickExpected(e.target.value)}/>
          </label>
          <p className="mt-2 text-xs text-muted-foreground">{ar?"إذا في فرق، يظهر اقتراح تعديل مخصصاتك بعد التسجيل، وتؤكده أنت.":"If actual differs, you'll be offered a budget adjustment to approve."}</p>
        </details>
        {quickError&&<p role="alert" className="text-sm text-destructive sm:col-span-3">{quickError}</p>}
        <p className="text-xs text-muted-foreground sm:col-span-3">{ar?"التسجيل يضيف المصروف للتاريخ، ولا يخصم من رصيدك اليدوي تلقائياً.":"Recording adds the payment to your spending history. It does not automatically deduct it from your manually entered cash balance."}</p>
      </form>
      {editing && (
        <ExpenseForm
          initial={editing}
          cats={cats}
          members={members}
          budgetItems={budgetItems}
          onCancel={() => setEditing(null)}
          onSave={(x) => {
            onChange(x.id ? expenses.map((e) => (e.id === x.id ? x : e)) : [{ ...x, id: uid() }, ...expenses]);
            setEditing(null);
            toast.success(tr("Expense saved"));
          }}
        />
      )}
      <div className="mt-5 flex items-center justify-between gap-2">
       <h3 className="text-sm font-semibold">{showHistory?(ar?"كل المصاريف المسجلة":"All recorded expenses"):(ar?"مصاريف هذا الشهر":"This month's expenses")}</h3>
       {olderCount>0&&<button type="button" className="min-h-9 text-xs font-semibold text-brand underline" onClick={()=>setShowHistory(v=>!v)}>{showHistory?(ar?"هذا الشهر فقط":"This month only"):(ar?"عرض المصاريف السابقة":"Show older expenses")}</button>}
      </div>
      {sorted.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">{ar?"ما في مصاريف مسجّلة هون. سجّل أول مصروف أعلاه.":"No spending recorded here yet. Add your first expense above."}</p>
      ) : (
        <ul className="mt-3 divide-y">
          {sorted.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.note || tr(catName(e.categoryId))}</p>
                {e.status==="planned"&&<button type="button" onClick={()=>{setConfirming(e.id);setActualValue(String(e.amount));}} className="mt-1 min-h-9 rounded-lg bg-[#E8F1E7] px-2.5 text-xs font-semibold text-brand">{ar?"أكد الدفع الفعلي":"Confirm actual payment"}</button>}
                {confirming===e.id&&e.status==="planned"&&<div className="mt-2 rounded-xl border border-border bg-[#F9FBF6] p-3">
                  <label className="block text-xs font-semibold">{ar?"كم دفعت فعلياً؟ (د.أ)":"Actual amount paid (JOD)"}
                    <Input className="mt-1 max-w-44" type="number" min={0} max={50000} step=".01" value={actualValue} onChange={ev=>setActualValue(ev.target.value)}/>
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">{ar?"المتوقع ":"Expected "}{fmtJOD(e.plannedAmount??e.amount)} · {ar?"اختر إذا كان الرصيد يشمل الدفع أو يحتاج للخصم. تعديل المخصصات يتطلب موافقتك.":"Choose whether cash already reflects this payment. Budget changes need your approval."}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cashBalance!==null&&<Button size="sm" type="button" variant="outline" onClick={()=>{ const v=Number(actualValue);
                      if(actualValue.trim()===""||!Number.isFinite(v)||v<0||v>50000)return setQuickError(ar?"راجع المبلغ الفعلي والرصيد.":"Check the actual amount and balance.");
                      onConfirmPlanned(e.id,Math.round(v*100)/100,"already");
                      setConfirming(null);setQuickError("");
                      toast.success(ar?"تم تسجيل المبلغ الفعلي.":"Actual payment confirmed."); }}>{ar?"الرصيد يشمل الدفع":"Already in cash balance"}</Button>}
                    {cashBalance!==null&&<Button size="sm" type="button" onClick={()=>{ const v=Number(actualValue);
                      if(actualValue.trim()===""||!Number.isFinite(v)||v<0||v>50000||cashBalance===null||v>cashBalance)return setQuickError(ar?"راجع المبلغ الفعلي والرصيد.":"Check the actual amount and balance.");
                      onConfirmPlanned(e.id,Math.round(v*100)/100,"deduct");
                      setConfirming(null);setQuickError("");
                      toast.success(ar?"تم تسجيل المبلغ الفعلي.":"Actual payment confirmed."); }}>{ar?"اخصمه من الرصيد":"Deduct from cash"}</Button>}
                    {cashBalance===null&&<Button size="sm" type="button" onClick={()=>{ const v=Number(actualValue);
                      if(actualValue.trim()===""||!Number.isFinite(v)||v<0||v>50000)return setQuickError(ar?"راجع المبلغ الفعلي والرصيد.":"Check the actual amount and balance.");
                      onConfirmPlanned(e.id,Math.round(v*100)/100,"untracked");
                      setConfirming(null);setQuickError("");
                      toast.success(ar?"تم تسجيل المبلغ الفعلي.":"Actual payment confirmed."); }}>{ar?"تأكيد (دون رصيد مدخل)":"Confirm (no cash balance)"}</Button>}
                    <Button size="sm" type="button" variant="ghost" onClick={()=>setConfirming(null)}>{ar?"إلغاء":"Cancel"}</Button>
                  </div>
                </div>}
                {e.budgetItemId&&budgetItems.some(i=>i.id===e.budgetItemId&&i.categoryId===e.categoryId)&&<p className="text-xs text-brand">{ar?"البند: ":"Item: "}{budgetItems.find(i=>i.id===e.budgetItemId)?.name}</p>}
                <p className="text-xs text-muted-foreground">
                  {e.status==="planned"?(ar?"بانتظار الدفع · ":"Planned, not paid · "):""}{e.date} · {tr(catName(e.categoryId))} {e.owner ? `· ${e.owner}` : ""} · {e.shared?(ar?"عائلي محلي":"Household label"):(ar?"خاص على الجهاز":"Private on device")}
                </p>
              </div>
              <div className="shrink-0 text-end"><span className="block font-semibold tabular-nums">{fmtJOD(e.amount)}</span>
                 {e.status==="planned"&&<span className="block text-[11px] text-muted-foreground">{ar?"متوقع":"Expected"}</span>}
                 {e.status!=="planned"&&e.plannedAmount!=null&&e.plannedAmount!==e.amount&&<span className="block text-[11px] text-muted-foreground">{ar?"الخطة: ":"Plan: "}{fmtJOD(e.plannedAmount)}</span>}
               </div>
              <Button size="icon" variant="ghost" disabled={!!e.billId||!!e.allocation} aria-label={tr("Edit expense")} onClick={() => setEditing(e)}><Pencil className="size-4" /></Button>
              <Button size="icon" variant="ghost" disabled={!!e.billId} aria-label={tr("Delete expense")} onClick={() => onDelete(e)}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ExpenseForm({ initial, cats, members, budgetItems, onSave, onCancel }: { initial: Expense; cats: Category[]; members: Member[]; budgetItems:BudgetItem[]; onSave: (e: Expense) => void; onCancel: () => void }) {
  const { tr,lang } = useI18n();
  const ar=lang==="ar";
  const [f, setF] = useState({ ...initial, amountStr: initial.amount ? String(initial.amount) : "" });
  const [err, setErr] = useState("");
  return (
    <form
      className="mt-3 grid gap-3 rounded-xl bg-muted p-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const amount = parseAmount(f.amountStr, 50000);
        if (amount === null) return setErr(tr("Amount must be a positive number up to 50,000."));
        if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) return setErr(tr("Please pick a valid date."));
        const { amountStr: _a, ...rest } = f;
        onSave({ ...rest, amount, ...(rest.status==="planned"?{plannedAmount:amount}:{}),note: (f.note ?? "").slice(0, 60) });
      }}
    >
      <Field label={tr("Amount (JOD)")}><Input className={inputCls} inputMode="decimal" autoFocus value={f.amountStr} onChange={(e) => setF({ ...f, amountStr: e.target.value })} /></Field>
      <Field label={tr("Date")}><Input className={inputCls} type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
      <Field label={tr("Category")}>
        <NativeSelect value={f.categoryId} onChange={(e) => setF(previous=>{const {budgetItemId:_item,...rest}=previous;return {...rest,categoryId:e.target.value};})}>
          <option value="uncategorized">{ar?"غير مصنف بعد":"Uncategorized for now"}</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{tr(c.name)}</option>}
        </NativeSelect>
      </Field>
      {budgetItems.some(i=>i.categoryId===f.categoryId)&&<Field label={ar?"البند (اختياري)":"Item (optional)"}>
        <NativeSelect value={budgetItems.some(i=>i.id===f.budgetItemId&&i.categoryId===f.categoryId)?f.budgetItemId??"":""}
         onChange={(e)=>setF(previous=>{const {budgetItemId:_item,...rest}=previous;return e.target.value?{...rest,budgetItemId:e.target.value}:rest;})}>
         <option value="">{ar?"الفئة فقط":"Category only"}</option>
         {budgetItems.filter(i=>i.categoryId===f.categoryId).map(i=><option key={i.id} value={i.id}>{i.name}</option>)}
        </NativeSelect>
       </Field>}
      <Field label={tr("Owner (optional)")}>
        <NativeSelect value={f.owner ?? ""} onChange={(e) => setF((previous) => { const { owner: _owner, ...withoutOwner } = previous; return e.target.value ? { ...withoutOwner, owner: e.target.value } : withoutOwner; })}>
          <option value="">—</option>
          <option value="Household">{tr("Household")}</option>
          {members.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
        </NativeSelect>
      </Field>
      <Field label={tr("Note (optional)")}><Input className={inputCls} maxLength={60} value={f.note ?? ""} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
      <label className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 text-sm font-medium">
        {f.shared ? (ar?"علامة عائلية محلية — لا مشاركة تلقائية":"Household label only — no automatic sharing") : (ar?"خاص على هذا الجهاز":"Private on this device")}
        <Switch checked={f.shared} onCheckedChange={(v) => setF({ ...f, shared: v })} />
      </label>
      {err && <p className="text-sm text-destructive sm:col-span-2" role="alert">{err}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" className="h-11 flex-1">{tr("Save expense")}</Button>
        <Button type="button" variant="outline" className="h-11" onClick={onCancel}>{tr("Cancel")}</Button>
      </div>
    </form>
  );
}