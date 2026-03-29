import assert from "node:assert/strict";
import { canAccessPath, getPostLoginPath, getVisibleNavHrefs, sanitizeJobPatchForRole } from "@/lib/authz";

{
  assert.equal(getPostLoginPath("OWNER", "/"), "/");
  assert.equal(getPostLoginPath("WORKER", "/"), "/jobs");
  assert.equal(getPostLoginPath("WORKER", "/jobs/job_1"), "/jobs/job_1");
  assert.equal(getPostLoginPath("WORKER", "/estimates"), "/jobs");
}

{
  assert.equal(canAccessPath("OWNER", "/estimates"), true);
  assert.equal(canAccessPath("WORKER", "/jobs"), true);
  assert.equal(canAccessPath("WORKER", "/calendar"), true);
  assert.equal(canAccessPath("WORKER", "/api/jobs/abc"), true);
  assert.equal(canAccessPath("WORKER", "/invoices"), false);
}

{
  assert.deepEqual(getVisibleNavHrefs("WORKER"), ["/calendar", "/jobs"]);
  assert.equal(getVisibleNavHrefs("OWNER").includes("/invoices"), true);
}

{
  const sanitized = sanitizeJobPatchForRole("WORKER", {
    title: "Nuovo titolo",
    assignedTo: "Luca Ferri",
    status: "in_progress",
    notes: "Arrivo tra 10 minuti"
  });

  assert.deepEqual(sanitized, {
    status: "in_progress",
    notes: "Arrivo tra 10 minuti"
  });
}

console.log("authz role tests passed");
