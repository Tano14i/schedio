// Funzioni pure per comporre i messaggi ai clienti: nessun accesso a rete o DB.

export type ChannelStatus = "sent" | "skipped" | "failed";

export type DeliveryResult = {
  email: ChannelStatus;
  whatsapp: ChannelStatus;
  /** Link wa.me precompilato, per l'invio manuale dal telefono. */
  whatsappLink: string | null;
  /** true se almeno un canale automatico ha consegnato il messaggio. */
  delivered: boolean;
  notes: string[];
};

const COUNTRY_DIAL_CODES: Record<string, string> = {
  IT: "39",
  NL: "31",
  BE: "32",
  DE: "49",
  FR: "33",
  ES: "34",
  CH: "41",
  AT: "43",
  GB: "44"
};

/**
 * Numero nel formato richiesto da wa.me: solo cifre, con prefisso
 * internazionale. I numeri nazionali prendono il prefisso del paese
 * dell'azienda. Restituisce null se il numero non e' utilizzabile.
 */
export function toWhatsAppNumber(phone: string | null | undefined, country = "NL") {
  if (!phone) {
    return null;
  }

  const trimmed = phone.trim();
  let digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  if (trimmed.startsWith("+")) {
    // gia' internazionale
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else {
    const dialCode = COUNTRY_DIAL_CODES[country.toUpperCase()];
    if (!dialCode) {
      return null;
    }
    if (!digits.startsWith(dialCode) || digits.length <= 10) {
      // In Olanda lo 0 iniziale si toglie (06... -> 316...), in Italia resta.
      const national = dialCode === "39" ? digits : digits.replace(/^0/, "");
      digits = `${dialCode}${national}`;
    }
  }

  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function buildWhatsAppLink(phone: string | null | undefined, text: string, country?: string) {
  const number = toWhatsAppNumber(phone, country);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** HTML semplice per le email: testo con a capo e link cliccabili. */
export function renderEmailHtml(input: { text: string; companyName: string }) {
  const body = escapeHtml(input.text)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#0b5cad">$1</a>')
    .replace(/\n/g, "<br>");

  return [
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1f2937;max-width:560px">',
    `<p>${body}</p>`,
    `<p style="color:#6b7280;font-size:13px;margin-top:24px">${escapeHtml(input.companyName)}</p>`,
    "</div>"
  ].join("");
}

/** Mittente: indirizzo di EMAIL_FROM con il nome dell'azienda. */
export function buildFromAddress(emailFrom: string, companyName: string) {
  const match = emailFrom.match(/<([^>]+)>/);
  const address = (match ? match[1] : emailFrom).trim();
  const name = companyName.replace(/["<>]/g, "").trim();
  return name ? `${name} <${address}>` : address;
}

/** Messaggio per chi ha premuto "Invia": cosa e' partito davvero. */
export function describeDelivery(delivery: DeliveryResult, subject: string, feminine = false) {
  const ending = feminine ? "a" : "o";
  const channels = [
    delivery.email === "sent" ? "email" : null,
    delivery.whatsapp === "sent" ? "WhatsApp" : null
  ].filter(Boolean);

  if (channels.length) {
    return `${subject} inviat${ending} via ${channels.join(" e ")}.`;
  }

  const reason = delivery.notes.join(" ");
  const manual = delivery.whatsappLink
    ? `Invia${feminine ? "la" : "lo"} dal tuo WhatsApp con il pulsante qui sotto.`
    : "Aggiungi email o telefono del cliente per inviarlo.";
  return `${subject} non inviat${ending} automaticamente. ${reason ? `${reason} ` : ""}${manual}`;
}
