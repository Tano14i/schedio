/**
 * Test di isolamento tra aziende su database reale.
 * Richiede DATABASE_URL verso un Postgres migrato (crea e poi cancella i dati).
 * Avvio: npm run test:db
 */
import assert from "node:assert/strict";
import { prisma } from "../lib/prisma";
import {
  createCustomer,
  createLeadWithCustomer,
  getActivityFeed,
  getCustomerDetailData,
  getCustomersPageData,
  getLeadById,
  getLeadsPageData,
  updateCustomer,
  updateLead
} from "../lib/crm-server";
import { createJob, getJobByIdForUser, getJobsPageData, updateJob } from "../lib/jobs-server";
import {
  completeJobAndCaptureSummary,
  createEstimateDraftForCustomer,
  getEstimatePageData,
  sendEstimateToCustomer,
  updateEstimate
} from "../lib/estimates-server";
import {
  createInvoiceDraftFromJob,
  getInvoicePageData,
  markInvoicePaid,
  sendInvoiceToCustomer
} from "../lib/invoices-server";
import { getWhatsAppAdminItems } from "../lib/whatsapp-admin";
import { getTeamPageData, updateUserHourlyCost } from "../lib/team-server";
import { runAutomationSuite } from "../lib/automations-server";

async function rejects(label: string, fn: () => Promise<unknown>) {
  await assert.rejects(fn, Error, `${label}: l'azienda B non deve poter agire sui dati di A`);
}

async function main() {
  const suffix = Date.now();
  const [companyA, companyB] = await Promise.all([
    prisma.company.create({ data: { name: `Tenant A ${suffix}` } }),
    prisma.company.create({ data: { name: `Tenant B ${suffix}` } })
  ]);
  const ownerA = await prisma.user.create({
    data: { companyId: companyA.id, role: "OWNER", name: "Owner A", email: `a-${suffix}@test.local` }
  });
  const ownerB = await prisma.user.create({
    data: { companyId: companyB.id, role: "OWNER", name: "Owner B", email: `b-${suffix}@test.local` }
  });
  const A = companyA.id;
  const B = companyB.id;
  const userB = { id: ownerB.id, companyId: B, role: ownerB.role };

  try {
    // Dati di A
    const customerA = await createCustomer(A, { fullName: "Cliente A", phone: `+3100${suffix}` });
    const leadA = await createLeadWithCustomer(A, {
      fullName: "Cliente A2",
      phone: `+3101${suffix}`,
      serviceType: "Idraulica",
      description: "Perdita"
    });
    const jobA = await createJob(A, {
      customerId: customerA.id,
      title: "Lavoro A",
      type: "job",
      startAt: new Date().toISOString(),
      address: "Via A 1"
    });
    const estimateA = await createEstimateDraftForCustomer(A, customerA.id);
    await completeJobAndCaptureSummary(A, jobA.id, {});
    const invoiceA = await createInvoiceDraftFromJob(A, jobA.id);

    // Liste: B non vede niente di A
    assert.equal((await getCustomersPageData(B)).data.length, 0, "clienti");
    assert.equal((await getLeadsPageData(B)).leads.length, 0, "richieste");
    assert.equal((await getJobsPageData(userB)).length, 0, "lavori");
    assert.equal((await getEstimatePageData(B)).estimates.length, 0, "preventivi");
    assert.equal((await getInvoicePageData(B)).invoices.length, 0, "fatture");
    assert.equal((await getActivityFeed(B)).length, 0, "attivita");
    assert.equal((await getWhatsAppAdminItems(B)).length, 0, "whatsapp");
    assert.equal((await getTeamPageData(B)).users.length, 1, "team");

    // A vede i propri dati
    assert.equal((await getCustomersPageData(A)).data.length, 2);
    assert.equal((await getInvoicePageData(A)).invoices.length, 1);

    // Lettura per id: B ottiene null
    assert.equal(await getCustomerDetailData(B, customerA.id), null, "dettaglio cliente");
    assert.equal(await getLeadById(B, leadA.id), null, "dettaglio richiesta");
    assert.equal(await getJobByIdForUser(jobA.id, userB), null, "dettaglio lavoro");

    // Scrittura per id: B viene rifiutata
    await rejects("updateCustomer", () => updateCustomer(B, customerA.id, { fullName: "hack" }));
    await rejects("updateLead", () => updateLead(B, leadA.id, { status: "lost" }));
    await rejects("updateJob", () => updateJob(B, jobA.id, { title: "hack" }));
    await rejects("completeJob", () => completeJobAndCaptureSummary(B, jobA.id, {}));
    await rejects("updateEstimate", () => updateEstimate(B, estimateA.id, { title: "hack" }));
    await rejects("sendEstimate", () => sendEstimateToCustomer(B, estimateA.id));
    await rejects("sendInvoice", () => sendInvoiceToCustomer(B, invoiceA.id));
    await rejects("markInvoicePaid", () => markInvoicePaid(B, invoiceA.id));
    await rejects("updateUserHourlyCost", () => updateUserHourlyCost(B, ownerA.id, { hourlyCost: 1 }));

    // Creazione con riferimenti a dati di A: rifiutata
    await rejects("createJob con cliente di A", () =>
      createJob(B, {
        customerId: customerA.id,
        title: "hack",
        type: "job",
        startAt: new Date().toISOString(),
        address: "x"
      })
    );
    await rejects("createEstimate con cliente di A", () => createEstimateDraftForCustomer(B, customerA.id));
    await rejects("createInvoice da lavoro di A", () => createInvoiceDraftFromJob(B, jobA.id));

    // I dati di A sono rimasti intatti
    const untouched = await prisma.customer.findUniqueOrThrow({ where: { id: customerA.id } });
    assert.equal(untouched.fullName, "Cliente A");
    const invoiceAfter = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceA.id } });
    assert.equal(invoiceAfter.status, "DRAFT");

    // Il runner avviato da B lavora solo su B
    await runAutomationSuite(B);
    assert.equal(await prisma.automation.count({ where: { companyId: A } }), 0);

    console.log("tenant isolation db tests passed");
  } finally {
    await prisma.company.deleteMany({ where: { id: { in: [A, B] } } });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
