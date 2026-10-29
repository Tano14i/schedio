"use client";

/** Pulsante per inviare a mano dal WhatsApp dell'artigiano, testo gia' pronto. */
export function ManualWhatsAppLink({ href, onDone }: { href: string | null; onDone?: () => void }) {
  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onDone}
      className="inline-flex items-center justify-center rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1ebe5a]"
    >
      Invia su WhatsApp
    </a>
  );
}
