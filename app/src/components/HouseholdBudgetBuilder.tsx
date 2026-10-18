import {useEffect,useState,type FormEvent} from "react";
import {ChevronDown,Plus,ReceiptText,Trash2} from "lucide-react";
import {fmtJOD,uid,useLocalState} from "@/lib/storage";
import {type Category,type Member,type MoneyState} from "@/lib/money";
import {useI18n} from "@/lib/i18n";
import {HOUSEHOLD_PRESENCE_KEY,emptyHouseholdPresence,type HouseholdPresence} from "@/lib/householdPresence";
import {
 BUDGET_TEMPLATES,PUBLIC_JORDAN_UNIT_PRICES,categoryKind,categoryItemTotal,
 categoryUnallocated,householdCategoryReference,itemIllustrativeReference,recordedItemSpending,monthlyItemCost,
 removeBudgetItem,setCategoryPlanFromItems,upsertBudgetItem,
 type BudgetItem,type ItemFrequency
} from "@/lib/householdBudgetBuilder";

type Props={money:MoneyState;setMoney:(fn:(s:MoneyState)=>MoneyState)=>void;members:Member[];onManageCategories:()=>void;focusedCategoryId?:string;compact?:boolean};
const input="mt-1 min-h-10 w-full rounded-lg border border-[#D7E3D3] bg-white px-3 text-sm";
const amount=(s:string)=>/^\d{1,6}(\.\d{1,2})?$/.test(s.trim())&&Number(s)<=100000?Number(s):null;
const ym=()=>{const n=new Date();return n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")};
const blank=(categoryId:string,name:string):BudgetItem=>{
 const official=PUBLIC_JORDAN_UNIT_PRICES.find(p=>p.name===name);
 return {
  id:uid(),categoryId,name,enabled:true,
  amountJod:0,frequency:"monthly",behaviour:"variable",priority:"essential",
  ...(official?{quantity:0,unitPriceJod:official.priceJod,unitLabel:official.unit,
   priceSource:official.source,priceCheckedMonth:official.checkedMonth}:{})
 };
};
function ItemEditor({item,onSave,onRemove}:{item:BudgetItem;onSave:(i:BudgetItem)=>void;onRemove:()=>void}){
 const {lang}=useI18n(),ar=lang==="ar";
 const [draft,setDraft]=useState(item);
 const [cost,setCost]=useState(String(item.amountJod));
 const [qty,setQty]=useState(String(item.quantity??""));
 const [price,setPrice]=useState(String(item.unitPriceJod??""));
 const [error,setError]=useState("");
 useEffect(()=>{setDraft(item);setCost(String(item.amountJod));setQty(String(item.quantity??""));setPrice(String(item.unitPriceJod??""));},[item]);
 const save=(event:FormEvent)=>{
  event.preventDefault();
  const n=amount(cost),q=qty.trim()===""?null:amount(qty),p=price.trim()===""?null:amount(price);
  if(!draft.name.trim()||draft.name.length>90||n===null||
   (qty.trim()!==""&&q===null)||(price.trim()!==""&&p===null)||
   ((qty.trim()==="")!==(price.trim()===""))){setError(ar?"راجع المبالغ والكمية والسعر.":"Check the amount, quantity and unit price.");return;}
  const copy:BudgetItem={...draft,name:draft.name.trim(),amountJod:n};
  if(q!==null&&p!==null){copy.quantity=q;copy.unitPriceJod=p;}else{
   delete copy.quantity;delete copy.unitPriceJod;delete copy.unitLabel;
   delete copy.priceSource;delete copy.priceCheckedMonth;
  }
  onSave(copy);setError("");
 };
 return <form onSubmit={save} className="mt-2 space-y-3 rounded-xl border border-[#DBE6DA] bg-[#F9FBF8] p-3">
  <div className="flex items-start justify-between gap-2">
   <label className="min-w-0 flex-1 text-xs font-medium">
    {ar?"اسم المصروف":"Expense item"}
    <input className={input} maxLength={90} value={draft.name}
     onChange={e=>setDraft(d=>({...d,name:e.target.value}))}/>
   </label>
   <button type="button" aria-label={ar?"حذف البند":"Remove budget item"} onClick={onRemove}
    className="mt-5 grid size-10 shrink-0 place-items-center rounded-lg border border-[#E3DEDA]"><Trash2 className="size-4"/></button>
  </div>
  <label className="flex items-center gap-2 text-xs">
   <input type="checkbox" checked={draft.enabled} onChange={e=>setDraft(d=>({...d,enabled:e.target.checked}))}/>
   {ar?"احتسب هذا البند ضمن الميزانية":"Include this item in the breakdown"}
  </label>
  <div className="grid grid-cols-2 gap-3">
   <label className="text-xs">{ar?"المبلغ لكل فترة (د.أ)":"Amount per period (JOD)"}
    <input type="number" min={0} max={100000} step=".01" className={input} value={cost}
     onChange={e=>setCost(e.target.value)}/>
   </label>
   <label className="text-xs">{ar?"كم مرة تدفع؟":"Frequency"}
    <select className={input} value={draft.frequency} onChange={e=>setDraft(d=>({...d,frequency:e.target.value as ItemFrequency}))}>
     <option value="monthly">{ar?"شهرياً":"Monthly"}</option>
     <option value="weekly">{ar?"أسبوعياً":"Weekly"}</option>
     <option value="quarterly">{ar?"كل ٣ أشهر":"Quarterly"}</option>
     <option value="yearly">{ar?"سنوياً":"Yearly"}</option>
    </select>
   </label>
   <label className="text-xs">{ar?"طبيعة التكلفة":"Cost behaviour"}
    <select className={input} value={draft.behaviour} onChange={e=>setDraft(d=>({...d,behaviour:e.target.value as BudgetItem["behaviour"]}))}>
     <option value="fixed">{ar?"ثابتة":"Fixed"}</option><option value="variable">{ar?"متغيرة":"Variable"}</option>
    </select>
   </label>
   <label className="text-xs">{ar?"الأهمية للعيلة":"Family priority"}
    <select className={input} value={draft.priority} onChange={e=>setDraft(d=>({...d,priority:e.target.value as BudgetItem["priority"]}))}>
     <option value="essential">{ar?"أساسي":"Essential"}</option>
     <option value="protected">{ar?"مهم ونحافظ عليه":"Protected"}</option>
     <option value="flexible">{ar?"مرن":"Flexible"}</option>
    </select>
   </label>
  </div>
  {draft.unitLabel&&<div className="rounded-lg border border-[#DFE8DC] bg-white p-3">
   <p className="text-xs font-semibold">{ar?"حساب حسب الكمية":"Optional quantity calculation"}</p>
   <div className="mt-2 grid grid-cols-2 gap-2">
    <label className="text-xs">{ar?"الكمية":"Quantity"} ({draft.unitLabel})
     <input type="number" min={0} step=".01" className={input} value={qty} onChange={e=>setQty(e.target.value)}/>
    </label>
    <label className="text-xs">{ar?"سعر الوحدة (د.أ)":"Unit price (JOD)"}
     <input type="number" min={0} step=".01" className={input} value={price} onChange={e=>setPrice(e.target.value)}/>
    </label>
   </div>
   <p className="mt-2 text-xs text-muted-foreground">{ar?"السعر الرسمي المرجعي":"Public unit price"}: {draft.priceCheckedMonth}.{" "}
    {draft.priceSource?<a className="underline" href={draft.priceSource} target="_blank" rel="noopener noreferrer">{ar?"المصدر الحكومي":"Government source"}</a>:null}.{" "}
    {ar?"الحساب حسب الكمية يحل مكان المبلغ اليدوي أعلاه، ولا يضاف عليه.":"Quantity × price replaces the manual amount; it is not added to it."}
   </p>
  </div>}
  <p className="text-xs text-muted-foreground">{ar?"المعادل الشهري بعد الحفظ: ":"Monthly equivalent when saved: "}{fmtJOD(monthlyItemCost({...draft,amountJod:amount(cost)??0,...(draft.unitLabel&&qty!==""&&price!==""?{quantity:Number(qty),unitPriceJod:Number(price)}:{})}))}</p>
  {error&&<p role="alert" className="text-xs font-semibold text-destructive">{error}</p>}
  <button className="min-h-10 rounded-full bg-brand px-4 text-sm font-semibold text-white" type="submit">{ar?"احفظ البند":"Save item"}</button>
 </form>;
}
function CategoryDetails({category,money,setMoney,members,presence,month,autoOpen=false}:{category:Category;money:MoneyState;setMoney:Props["setMoney"];members:Member[];presence:HouseholdPresence;month:string;autoOpen?:boolean}){
 const {lang}=useI18n(),ar=lang==="ar";
 const [newItem,setNewItem]=useState("");
 const [custom,setCustom]=useState("");
 const [selected,setSelected]=useState<string|null>(null);
 const [plan,setPlan]=useState(String(category.planned));
 const [error,setError]=useState("");
 useEffect(()=>setPlan(String(category.planned)),[category.planned]);
 const items=(money.budgetItems??[]).filter(i=>i.categoryId===category.id);
 const subtotal=categoryItemTotal(money.budgetItems??[],category.id);
 const remainder=categoryUnallocated(money,category.id);
 const ref=householdCategoryReference(category,members,presence,month);
 const recorded=recordedItemSpending(money,category.id,month);
 const spent=recorded.total;
 const templates=BUDGET_TEMPLATES[categoryKind(category)].filter(name=>!items.some(i=>i.name===name));
 const add=(name:string)=>{
  if(!name.trim())return;
  const item=blank(category.id,name.trim());
  setMoney(s=>upsertBudgetItem(s,item));
  setSelected(item.id);setNewItem("");setCustom("");setError("");
 };
 const savePlan=()=>{
  const n=amount(plan);
  if(n===null||n<subtotal){setError(ar?"المخصص لازم يغطي البنود المفصّلة، أو عدّل البنود أولاً.":"Category allocation must cover itemized costs. Edit items first.");return;}
  if(money.demo)return;
  setMoney(s=>({...s,categories:s.categories.map(c=>c.id===category.id?{...c,planned:n,amountConfidence:"confirmed"}:c)}));
  setError("");
 };
 return <details defaultOpen={autoOpen} className="rounded-xl border border-[#DEE8DB] bg-white p-3" data-budget-category={category.id}>
  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2">
   <span className="min-w-0 flex-1"><strong className="block text-sm">{category.name}</strong>
    <span className="text-xs text-muted-foreground">{ar?"مخطط شهري ":"Monthly plan "}{fmtJOD(category.planned)} · {ar?"مدفوع ":"Paid "}{fmtJOD(spent)}</span>
   </span>
   <span className="shrink-0 text-end text-xs">{ref?
    <><span className="block font-semibold">{fmtJOD(ref.amountJod)}</span><span className="text-muted-foreground">{ar?"مرجع توضيحي":"Illustrative reference"}</span></>:
    <span className="text-muted-foreground">{ar?"لا يوجد مرجع موثوق":"Reference unavailable"}</span>}
   </span>
   <ChevronDown className="size-4 shrink-0 text-brand"/>
  </summary>
  <div className="mt-3 space-y-3 border-t border-[#E6ECE4] pt-3">
   {ref&&<p className="text-xs leading-relaxed text-muted-foreground">{ar?
    "نموذج توضيحي يتغير حسب عدد البالغين والأطفال والضيوف والمساعدين المضافين. ليس متوسط إنفاق رسمي للأسر في عمّان.":
    "A household-adjusted illustrative calculation, NOT an observed public-data average for Amman. Helper and visitor costs are included only when you entered them. Do not count them twice."}</p>}
   <div className="grid grid-cols-2 gap-2">
    <div className="rounded-lg bg-[#F4F8F2] p-3">
     <p className="text-xs text-muted-foreground">{ar?"المخصص الشهري":"Monthly allocation"}</p>
     <p className="mt-1 text-lg font-semibold">{fmtJOD(category.planned)}</p>
    </div>
    <div className="rounded-lg bg-[#FAF5ED] p-3">
     <p className="text-xs text-muted-foreground">{ar?"المدفوع في الشهر المختار":"Paid in selected month"}</p>
     <p className="mt-1 text-lg font-semibold">{fmtJOD(spent)}</p>
    </div>
   </div>
   <div className="rounded-lg bg-[#F5F8F2] p-3">
    <div className="flex justify-between gap-2 text-xs"><span>{ar?"بنود موزّعة":"Itemized"}</span><strong>{fmtJOD(subtotal)}</strong></div>
    <div className="mt-1 flex justify-between gap-2 text-xs"><span>{remainder<0?(ar?"البنود تتجاوز المخصص":"Items above allocation"):(ar?"لم يوزّع على بنود":"Not yet itemized")}</span><strong>{fmtJOD(Math.abs(remainder))}</strong></div>
    <p className="mt-2 text-xs text-muted-foreground">{ar?"البنود هي تفاصيل للمخصص الموجود، مش مصاريف إضافية.":"Items explain the category plan; they are never counted as additional spending."}</p>
   </div>
   {!money.demo&&<div className="flex flex-wrap items-end gap-2">
    <label className="min-w-32 flex-1 text-xs">{ar?"عدّل مخصص الفئة (د.أ/شهر)":"Edit category allocation (JOD/month)"}
     <input type="number" min={0} step=".01" className={input} value={plan} onChange={e=>setPlan(e.target.value)}/>
    </label>
    <button className="min-h-10 rounded-full border border-[#CEDCCD] px-3 text-xs font-semibold text-brand" type="button" onClick={savePlan}>{ar?"احفظ المخصص":"Save plan"}</button>
   </div>}
   {error&&<p role="alert" className="text-xs text-destructive">{error}</p>}
   {items.length>0&&<p className="text-xs leading-relaxed text-muted-foreground">{ar?
    "كل بند: خطتك الشهرية، مرجع توضيحي إذا متاح، والمدفوع المرتبط به في الشهر المختار. المرجع ليس سعر سوق مؤكداً.":
    "Each item shows your monthly plan, an illustrative reference where available, and paid spending linked to it in the selected month. References are not verified market prices."}</p>}
   {items.map(item=>{
    const itemRef=itemIllustrativeReference(category,item,ref);
    return <div key={item.id} className="border-t border-[#E7EEE5] pt-2">
     <button type="button" className="w-full text-start text-sm font-semibold text-brand underline underline-offset-2" onClick={()=>setSelected(v=>v===item.id?null:item.id)}>
      {item.name}{!item.enabled?(ar?" (مستبعد من الخطة)":" (excluded from plan)"):""}
     </button>
     <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-[#F6F9F4] p-2 text-xs">
      <div><span className="block text-muted-foreground">{ar?"خطتك":"Your plan"}</span>
       <strong className="mt-1 block tabular-nums">{fmtJOD(monthlyItemCost(item))}</strong></div>
      <div><span className="block text-muted-foreground">{ar?"مرجع توضيحي":"Illustrative ref."}</span>
       <strong className="mt-1 block tabular-nums">{itemRef===null?"—":fmtJOD(itemRef)}</strong></div>
      <div><span className="block text-muted-foreground">{ar?"دفعت":"Paid"}</span>
       <strong className="mt-1 block tabular-nums">{fmtJOD(recorded.byItem[item.id]??0)}</strong></div>
     </div>
     {selected===item.id&&<ItemEditor item={item} onSave={v=>{setMoney(s=>upsertBudgetItem(s,v));setSelected(null);}}
      onRemove={()=>{if(window.confirm(ar?"حذف هذا البند من التفصيل؟":"Remove this item from the breakdown?")){setMoney(s=>removeBudgetItem(s,item.id));setSelected(null);}}}/>}
    </div>;
   })}
   {recorded.unassigned>0&&<div className="rounded-lg border border-[#E7E8DC] bg-[#FFFCF6] p-3 text-xs">
    <div className="flex justify-between gap-2"><span>{ar?"مدفوع دون تحديد بند":"Payments not assigned to an item"}</span>
     <strong>{fmtJOD(recorded.unassigned)}</strong></div>
    <p className="mt-1 text-muted-foreground">{ar?
     "مصاريف قديمة أو غير مصنفة. داخلة بمجموع الفئة، بدون توزيع تلقائي بالتخمين.":
     "Older or category-only spending counts toward the category total without guessing which item it belongs to."}</p>
   </div>}
   {!money.demo&&<>
    {templates.length>0&&<div className="flex flex-wrap items-end gap-2">
     <label className="min-w-32 flex-1 text-xs">{ar?"اختر بنداً جاهزاً":"Add a suggested item"}
      <select className={input} value={newItem} onChange={e=>setNewItem(e.target.value)}>
       <option value="">{ar?"اختر...":"Choose..."}</option>
       {templates.map(name=><option key={name} value={name}>{name}</option>)}
      </select>
     </label>
     <button type="button" disabled={!newItem} onClick={()=>add(newItem)}
      className="min-h-10 rounded-full border border-[#CEDCCD] px-3 text-xs font-semibold text-brand disabled:opacity-40"><Plus className="me-1 inline size-4"/>{ar?"أضف":"Add"}</button>
    </div>}
    <div className="flex flex-wrap items-end gap-2">
     <label className="min-w-32 flex-1 text-xs">{ar?"أو بند من عندك":"Or create your own item"}
      <input className={input} value={custom} maxLength={90} onChange={e=>setCustom(e.target.value)} placeholder={ar?"مثال: احتياجات خاصة":"e.g. dietary supplies"}/>
     </label>
     <button type="button" disabled={!custom.trim()} onClick={()=>add(custom)}
      className="min-h-10 rounded-full border border-[#CEDCCD] px-3 text-xs font-semibold text-brand disabled:opacity-40"><Plus className="me-1 inline size-4"/>{ar?"أضف":"Add"}</button>
    </div>
    {items.length>0&&Math.abs(remainder)>.005&&<button type="button" className="min-h-10 text-xs font-semibold text-brand underline underline-offset-2" onClick={()=>{
     if(window.confirm(ar?"هل تريد جعل مخصص الفئة يساوي مجموع بنودها؟ لن يتغير الإنفاق الفعلي أو الفواتير.":"Replace this category allocation with its item subtotal? No actual spending or bills will change.")){
      setMoney(s=>setCategoryPlanFromItems(s,category.id));
     }
    }}>{ar?"اعتمد مجموع البنود كمخصص للفئة":"Use item total as my category plan"}</button>}
   </>}
  </div>
 </details>;
}
export function HouseholdBudgetBuilder({money,setMoney,members,onManageCategories,focusedCategoryId,compact=false}:Props){
 const {lang}=useI18n(),ar=lang==="ar";
 const [presence]=useLocalState<HouseholdPresence>(HOUSEHOLD_PRESENCE_KEY,emptyHouseholdPresence());
 const [month,setMonth]=useState(ym);
 const categories=focusedCategoryId?money.categories.filter(c=>c.id===focusedCategoryId):money.categories;
 return <section className="rounded-2xl border border-[#DAE5D9] bg-[#F8FBF7] p-4 sm:p-5" aria-label={ar?"بناء ميزانية البيت":"Build household budget"}>
  {!compact&&<div className="flex items-start gap-3">
   <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E4F0E3] text-brand"><ReceiptText className="size-5"/></div>
   <div className="min-w-0 flex-1">
    <p className="text-xs font-semibold tracking-wide text-brand">{ar?"خطة بيتك":"YOUR HOUSEHOLD BUDGET"}</p>
    <h2 className="mt-1 text-lg font-semibold">{ar?"ابنِ ميزانيتك بنداً بنداً":"Build your budget, your way"}</h2>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?
     "افتح الفئة لتشوف خطتك الشهرية والمصاريف المدفوعة والمرجع التوضيحي لكل بند. التفاصيل اختيارية.":
     "Open a category to compare each item’s current monthly plan, paid spending and illustrative reference. All item details remain optional."}</p>
   </div>
  </div>}
  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
   <label className="text-xs">{ar?"شهر مقارنة المصروف":"Spending comparison month"}
    <input className={input} type="month" value={month} onChange={e=>setMonth(e.target.value||ym())}/>
   </label>
   <button type="button" className="min-h-10 text-xs font-semibold text-brand underline" onClick={onManageCategories}>{ar?"أضف أو عدّل فئة":"Manage categories"}</button>
  </div>
  <div className="mt-3 space-y-2">
   {categories.map(category=><CategoryDetails key={category.id} category={category} money={money}
    setMoney={setMoney} members={members} presence={presence} month={month} autoOpen={!!focusedCategoryId}/>)}
   {money.categories.length===0&&<p className="rounded-lg bg-white p-4 text-sm text-muted-foreground">{ar?
    "ما في فئات بعد. أضف أول فئة للبدء، ويمكن ترك الميزانية الإجمالية لوقت لاحق.":
    "No spending categories yet. Add one category to begin; detailed allocations can wait."}</p>}
  </div>
  {!compact&&<p className="mt-3 text-xs text-muted-foreground">{ar?"الخطة هي المخصص الحالي؛ أما المدفوع فهو للشهر المختار.":"Plan figures are current monthly allocations; paid amounts are filtered to the chosen month."}</p>}
   <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
   {ar?"الأرقام المرجعية العامة هنا نموذج توضيحي وليست إحصاءات سوق رسمية؛ فقط سعر البنزين والغاز مرتبط بمصدر حكومي لشهر تشرين الأول ٢٠٢٦. ما بنغيّر أي ميزانية حسب المرجع من دون قرارك.":
    "Household reference totals are illustrative assumptions, not current public spending statistics. Only Petrol 90 and domestic LPG have verified government unit prices (October 2026). References never overwrite your plan automatically."}
  </p>
  {!compact&&<p className="mt-1 text-xs text-muted-foreground">{ar?
   "المصدر العام لمسح إنفاق الأسرة الأردنية هو دائرة الإحصاءات العامة (2017–2018)؛ الأرقام القديمة ليست تقديرات شهرية حالية لعمّان.":
   "Jordan's Department of Statistics publishes historical household spending data (2017–18), but that survey is not presented as a current 2026 Amman benchmark."}{" "}
   <a className="underline" href="https://dosweb.dos.gov.jo/expenditures-income-tables2017/" target="_blank" rel="noopener noreferrer">{ar?"اطّلع على المصدر":"View survey source"}</a>.
  </p>}
 </section>;
}
