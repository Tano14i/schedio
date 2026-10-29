import assert from "node:assert/strict";
import {
  buildFromAddress,
  buildWhatsAppLink,
  describeDelivery,
  renderEmailHtml,
  toWhatsAppNumber,
  type DeliveryResult
} from "../lib/message-format";

// Numeri: internazionali, con 00, nazionali italiani e olandesi
assert.equal(toWhatsAppNumber("+39 347 555 1200", "NL"), "393475551200");
assert.equal(toWhatsAppNumber("0039 347 555 1200"), "393475551200");
assert.equal(toWhatsAppNumber("347 555 1200", "IT"), "393475551200");
assert.equal(toWhatsAppNumber("02 1234 5678", "IT"), "390212345678");
assert.equal(toWhatsAppNumber("06 12345678", "NL"), "31612345678");
assert.equal(toWhatsAppNumber("+31 6 12345678", "IT"), "31612345678");
assert.equal(toWhatsAppNumber("393475551200", "IT"), "393475551200");
assert.equal(toWhatsAppNumber("", "IT"), null);
assert.equal(toWhatsAppNumber(null), null);
assert.equal(toWhatsAppNumber("12", "IT"), null);
assert.equal(toWhatsAppNumber("612345678", "XX"), null);

assert.equal(
  buildWhatsAppLink("+31612345678", "Ciao Anna, ecco il preventivo: https://x.test/p?a=1&b=2"),
  "https://wa.me/31612345678?text=Ciao%20Anna%2C%20ecco%20il%20preventivo%3A%20https%3A%2F%2Fx.test%2Fp%3Fa%3D1%26b%3D2"
);
assert.equal(buildWhatsAppLink("", "x"), null);

// Email: niente HTML iniettato dal testo, link cliccabili
const html = renderEmailHtml({ text: "Ciao <b>Mario</b>\nVedi https://x.test/p", companyName: "Rossi & Figli" });
assert.ok(html.includes("Ciao &lt;b&gt;Mario&lt;/b&gt;<br>"));
assert.ok(html.includes('<a href="https://x.test/p"'));
assert.ok(html.includes("Rossi &amp; Figli"));

assert.equal(buildFromAddress("Schedio <notifiche@schedio.it>", "Idraulica Rossi"), "Idraulica Rossi <notifiche@schedio.it>");
assert.equal(buildFromAddress("notifiche@schedio.it", 'Ditta "<x>"'), "Ditta x <notifiche@schedio.it>");

const base: DeliveryResult = { email: "skipped", whatsapp: "skipped", whatsappLink: null, delivered: false, notes: [] };
assert.equal(describeDelivery({ ...base, email: "sent", delivered: true }, "Preventivo"), "Preventivo inviato via email.");
assert.equal(
  describeDelivery({ ...base, email: "sent", whatsapp: "sent", delivered: true }, "Fattura", true),
  "Fattura inviata via email e WhatsApp."
);
assert.ok(
  describeDelivery({ ...base, whatsappLink: "https://wa.me/1", notes: ["Il cliente non ha un indirizzo email."] }, "Preventivo")
    .includes("Invialo dal tuo WhatsApp")
);
assert.ok(
  describeDelivery({ ...base, notes: [] }, "Fattura", true).startsWith("Fattura non inviata automaticamente.")
);

console.log("message format tests passed");
