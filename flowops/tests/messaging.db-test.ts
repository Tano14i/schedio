/**
 * Invii reali ai clienti, su database reale e rete simulata (fetch finto).
 * Richiede DATABASE_URL verso un Postgres migrato. Avvio: npm run test:db
 */
import assert from "node:assert/strict";

process.env.RESEND_API_KEY = "re_test_key";
process.env.EMAIL_FROM = "Schedio <notifiche@schedio.test>";
delete process.env.OPENAI_API_KEY;
delete process.env.WHATSAPP_ACCESS_TOKEN;

type Call = { url: string; body: Record<string, unknown> };
const calls: Call[] = [];
let resendShouldFail = false;

globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const body = init?.body ? JSON.parse(String(init.body)) : {};
  calls.push({ url, body });
  if (url.includes("api.resend.com")) {
    return resendShouldFail
      ? new Response(JSON.stringify({ name: "validation_error", message: "Dominio non verificato", statusCode: 403 }), { status: 403 })
      : new Response(JSON.stringify({ id: "email_123" }), { status: 200 });
  }
  return new Response("{}", { status: 404 });
}) as typeof fetch;

async function main() {
  const { prisma } = await import("../lib/prisma");
  const { createCustomer } = await import("../lib/crm-server");
  const { createEstimateDraftForCustomer, sendDueEstimateFollowUps, sendEstimateToCustomer } = await import(
    "../lib/estimates-server"
  );

  const suffix = Date.now();
  const company = await prisma.company.create({
    data: { name: "Idraulica Rossi", email: "info@rossi.test", country: "IT" }
  });

  try {
    const withEmail = await createCustomer(company.id, {
      fullName: "Anna Verdi",
      phone: "347 555 1200",
      email: `anna-${suffix}@cliente.test`
    });
    const withoutEmail = await createCustomer(company.id, { fullName: "Luca Neri", phone: "06 12345678" });

    // 1. Cliente con email: parte un'email vera (verso Resend)
    const estimateA = await createEstimateDraftForCustomer(company.id, withEmail.id);
    const sentA = await sendEstimateToCustomer(company.id, estimateA.id);
    assert.equal(sentA.delivery.email, "sent");
    assert.equal(sentA.delivery.delivered, true);
    const emailCall = calls.find((call) => call.url.includes("api.resend.com"));
    assert.ok(emailCall, "chiamata a Resend");
    assert.deepEqual(emailCall.body.to, `anna-${suffix}@cliente.test`);
    assert.equal(emailCall.body.from, "Idraulica Rossi <notifiche@schedio.test>");
    assert.equal(emailCall.body.reply_to, "info@rossi.test");
    assert.ok(String(emailCall.body.text).includes(`/public/estimates/${sentA.publicToken}`));

    // 2. Cliente senza email e senza WhatsApp collegato: nessun finto "inviato",
    //    ma link wa.me pronto con il prefisso italiano
    const estimateB = await createEstimateDraftForCustomer(company.id, withoutEmail.id);
    const sentB = await sendEstimateToCustomer(company.id, estimateB.id);
    assert.equal(sentB.delivery.delivered, false);
    assert.ok(sentB.delivery.whatsappLink?.startsWith("https://wa.me/390612345678?text="));

    // 3. Follow-up automatici scaduti: partono solo dove c'e' un canale
    await prisma.estimateFollowUp.updateMany({
      where: { companyId: company.id },
      data: { scheduledFor: new Date(Date.now() - 60_000) }
    });
    calls.length = 0;
    await sendDueEstimateFollowUps(company.id);

    const followUpA = await prisma.estimateFollowUp.findFirstOrThrow({ where: { estimateId: estimateA.id } });
    const followUpB = await prisma.estimateFollowUp.findFirstOrThrow({ where: { estimateId: estimateB.id } });
    assert.equal(followUpA.status, "sent");
    assert.equal(followUpB.status, "failed");
    const logB = await prisma.automationLog.findFirstOrThrow({ where: { relatedEntityId: followUpB.id } });
    assert.equal(logB.status, "FAILED");
    assert.ok(logB.errorMessage?.includes("non ha un indirizzo email"), logB.errorMessage ?? "");
    assert.equal(calls.filter((call) => call.url.includes("api.resend.com")).length, 1);

    // 4. Errore del provider: segnato come fallito, con il motivo
    resendShouldFail = true;
    const estimateC = await createEstimateDraftForCustomer(company.id, withEmail.id);
    const sentC = await sendEstimateToCustomer(company.id, estimateC.id);
    assert.equal(sentC.delivery.email, "failed");
    assert.equal(sentC.delivery.delivered, false);
    assert.ok(sentC.delivery.notes.some((note) => note.includes("Dominio non verificato")));

    // 5. Recensioni: senza link configurato non si pianifica nulla
    const { createJob } = await import("../lib/jobs-server");
    const { completeJobAndCaptureSummary } = await import("../lib/estimates-server");
    const { createInvoiceDraftFromJob, markInvoicePaid } = await import("../lib/invoices-server");
    async function paidInvoice() {
      const job = await createJob(company.id, {
        customerId: withEmail.id,
        title: "Riparazione",
        type: "job",
        startAt: new Date().toISOString(),
        address: "Via Roma 1"
      });
      await completeJobAndCaptureSummary(company.id, job.id, {});
      const invoice = await createInvoiceDraftFromJob(company.id, job.id);
      await markInvoicePaid(company.id, invoice.id);
      return invoice;
    }
    const noLink = await paidInvoice();
    assert.equal(await prisma.reviewRequest.count({ where: { invoiceId: noLink.id } }), 0);
    await prisma.company.update({ where: { id: company.id }, data: { reviewUrl: "https://g.page/r/rossi" } });
    const withLink = await paidInvoice();
    const review = await prisma.reviewRequest.findFirstOrThrow({ where: { invoiceId: withLink.id } });
    assert.equal(review.reviewLink, "https://g.page/r/rossi");

    console.log("messaging db tests passed");
  } finally {
    await prisma.company.delete({ where: { id: company.id } });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
