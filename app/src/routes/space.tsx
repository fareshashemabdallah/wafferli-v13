import { useI18n } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppShell, Notice, PilotBadge } from "@/components/AppShell";
import { Field, NativeSelect, inputCls } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sampleMembers, type Member } from "@/lib/money";
import { uid, useLocalState } from "@/lib/storage";

export const Route = createFileRoute("/space")({
  head: () => ({
    meta: [
      { title: "My Space — Wafferli" },
      { name: "description", content: "Manage household member profiles, roles and preferences." },
      { property: "og:title", content: "My Space — Wafferli" },
      { property: "og:description", content: "Household profiles and privacy settings." },
    ],
  }),
  component: Space,
});

const ages = ["0–5", "6–12", "13–17", "18–29", "30–44", "45–59", "60+"];

function Space() {
  const { tr } = useI18n();
  const [members, setMembers] = useLocalState<Member[]>("members", sampleMembers());
  const [edit, setEdit] = useState<Member | null>(null);
  const [err, setErr] = useState("");
  const save = () => {
    if (!edit) return;
    if (!edit.name.trim()) return setErr(tr("Name is required."));
    const m = { ...edit, name: edit.name.trim().slice(0, 30), prefs: edit.prefs.slice(0, 120) };
    setMembers(m.id ? members.map((x) => (x.id === m.id ? m : x)) : [...members, { ...m, id: uid() }]);
    setEdit(null); setErr("");
  };
  return (
    <AppShell title={tr("My Space")}>
      <Notice>{tr("Household profiles are role-based samples stored on this device. Nothing here is shared with friends — votes never include your finances or household data.")}</Notice>
      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{tr("Household members")} <PilotBadge>{tr("Sample")}</PilotBadge></h2>
        <Button size="sm" onClick={() => setEdit({ id: "", name: "", role: "adult", ageGroup: "30–44", prefs: "" })} disabled={members.length >= 12}><Plus className="size-4" /> {tr("Add")}</Button>
      </div>
      {edit && (
        <div className="card-soft mt-3 grid gap-3 p-4 sm:grid-cols-2">
          <Field label={tr("Name")}><Input className={inputCls} value={edit.name} maxLength={30} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          <Field label={tr("Role")}><NativeSelect value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value as Member["role"] })}><option value="adult">{tr("Adult")}</option><option value="child">{tr("Child")}</option></NativeSelect></Field>
          <Field label={tr("Age group")}><NativeSelect value={edit.ageGroup} onChange={(e) => setEdit({ ...edit, ageGroup: e.target.value })}>{ages.map((a) => <option key={a}>{a}</option>)}</NativeSelect></Field>
          <Field label={tr("Preferences")}><Input className={inputCls} maxLength={120} value={edit.prefs} onChange={(e) => setEdit({ ...edit, prefs: e.target.value })} /></Field>
          {err && <p className="text-sm text-destructive sm:col-span-2" role="alert">{err}</p>}
          <div className="flex gap-2 sm:col-span-2"><Button className="flex-1" onClick={save}>{tr("Save")}</Button><Button variant="outline" onClick={() => setEdit(null)}>{tr("Cancel")}</Button></div>
        </div>
      )}
      <ul className="mt-3 space-y-2">
        {members.map((m) => (
          <li key={m.id} className="card-soft flex items-center gap-3 p-4">
            <span className="grid size-11 place-items-center rounded-full bg-mint font-semibold text-brand">{m.name[0]?.toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{tr(m.name)}</p>
              <p className="text-xs text-muted-foreground">{tr(m.role === "adult" ? "Adult" : "Child")} · {m.ageGroup}{m.prefs && ` · ${m.prefs}`}</p>
            </div>
            <Button size="icon" variant="ghost" aria-label={`Edit ${m.name}`} onClick={() => setEdit(m)}><Pencil className="size-4" /></Button>
            <Button size="icon" variant="ghost" aria-label={`Delete ${m.name}`} onClick={() => confirm(`Remove ${m.name}?`) && setMembers(members.filter((x) => x.id !== m.id))}><Trash2 className="size-4" /></Button>
          </li>
        ))}
        {members.length === 0 && <li className="rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">{tr("No members yet.")}</li>}
      </ul>
      <section className="card-soft mt-6 p-4 text-sm">
        <h2 className="font-semibold">{tr("Shared vs private expenses")}</h2>
        <p className="mt-1 text-muted-foreground">{tr("In My Money, each expense is marked shared (household) or private. In this pilot everything stays on this one device; multi-user household sharing isn't live yet.")}</p>
      </section>
    </AppShell>
  );
}