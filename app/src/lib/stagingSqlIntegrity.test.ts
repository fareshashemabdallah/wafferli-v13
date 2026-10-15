import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
/** Static smoke checks only; security requires real authenticated Supabase RLS
 * tests in an isolated staging project, never CI against production. */
const migrations=[
 "household_accounts_v1.sql","household_shared_expenses_v1.sql","private_vault_v1.sql"
];
describe("staging SQL migration structural safeguards",()=>{
 for(const file of migrations)it(file+": balanced PostgreSQL bodies, no public table writes",()=>{
  const sql=readFileSync(new URL("../../supabase/"+file,import.meta.url),"utf8");
  const declared=(sql.match(/\bCREATE OR REPLACE FUNCTION\b/g)||[]).length;
  const bodies=(sql.match(/\bAS \$\$/g)||[]).length;
  const closers=(sql.match(/\$\$;/g)||[]).length;
  expect(declared).toBeGreaterThan(0);
  expect(bodies).toBe(declared);
  expect(closers).toBe(declared);
  expect(sql).not.toMatch(/\bAS \$(?!\$)/);
  expect(sql).not.toMatch(/^\$;\s*$/m);
  expect((sql.match(/SECURITY DEFINER SET search_path=''/g)||[]).length).toBe(declared);
  expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
  expect(sql).toContain("REVOKE ALL ON");
  expect(sql).not.toMatch(/\bGRANT\s+(?:ALL|INSERT|UPDATE|DELETE)\b[^;]*\bTO authenticated\b/i);
 });
});
