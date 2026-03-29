import type { EstimateStatus, InvoiceStatus, JobStatus, LeadStatus } from "@/lib/types";

export const colors = {
  primary: {
    50: "#EEF6FA",
    100: "#DCECF5",
    200: "#B8D8EA",
    300: "#8DBFD9",
    400: "#5E9EC2",
    500: "#1F4D6B",
    600: "#16384E",
    700: "#122E40",
    800: "#0D2230",
    900: "#091721"
  },
  success: {
    50: "#ECFDF3",
    100: "#D1FADF",
    200: "#A6F4C5",
    300: "#6CE9A6",
    400: "#32D583",
    500: "#2FB36F",
    600: "#24945C",
    700: "#1C7348",
    800: "#175C3A",
    900: "#134C30"
  },
  warning: {
    50: "#FFF8EB",
    100: "#FDECC8",
    200: "#FBD98F",
    300: "#F7C35A",
    400: "#F2A93B",
    500: "#DC8A1F",
    600: "#B86E17",
    700: "#955513",
    800: "#794412",
    900: "#633911"
  },
  danger: {
    50: "#FEF3F2",
    100: "#FEE4E2",
    200: "#FECDCA",
    300: "#FDA29B",
    400: "#F97066",
    500: "#D95C5C",
    600: "#B54747",
    700: "#933737",
    800: "#7A2E2E",
    900: "#651F1F"
  },
  neutral: {
    0: "#FFFFFF",
    50: "#F7F9FB",
    100: "#EEF2F6",
    200: "#D9E1E7",
    300: "#C1CBD4",
    400: "#94A3B0",
    500: "#667684",
    600: "#4D5B67",
    700: "#36424C",
    800: "#1C2731",
    900: "#111827"
  }
} as const;

export const semantic = {
  background: "#F7F9FB",
  surface: "#FFFFFF",
  border: "#D9E1E7",
  textPrimary: "#1C2731",
  textSecondary: "#4D5B67",
  textMuted: "#667684",
  brand: "#1F4D6B",
  brandHover: "#16384E",
  success: "#2FB36F",
  warning: "#F2A93B",
  danger: "#D95C5C"
} as const;

export const typography = {
  h1: "text-4xl md:text-5xl font-semibold tracking-tight",
  h2: "text-3xl md:text-4xl font-semibold tracking-tight",
  h3: "text-2xl font-semibold tracking-tight",
  h4: "text-xl font-semibold",
  bodyLg: "text-lg text-slate-700",
  body: "text-base text-slate-700",
  bodySm: "text-sm text-slate-600",
  caption: "text-xs text-slate-500",
  label: "text-sm font-medium text-slate-800"
} as const;

export const radius = {
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "18px"
} as const;

export const shadow = {
  sm: "0 1px 2px rgba(16,24,40,0.06)",
  md: "0 4px 12px rgba(16,24,40,0.08)",
  lg: "0 12px 32px rgba(16,24,40,0.10)"
} as const;

export const spacing = {
  section: "py-16 md:py-24",
  container: "px-4 md:px-6 lg:px-8",
  stackSm: "space-y-2",
  stackMd: "space-y-4",
  stackLg: "space-y-6"
} as const;

export const leadStatusMap: Record<LeadStatus, { label: string; tone: string }> = {
  new: { label: "Nuova", tone: "bg-primary-50 text-primary-700 border-primary-200" },
  contacted: { label: "Contattata", tone: "bg-neutral-100 text-neutral-700 border-neutral-200" },
  scheduled: { label: "Programmata", tone: "bg-warning-50 text-warning-700 border-warning-200" },
  quoted: { label: "Preventivo inviato", tone: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  won: { label: "Lavoro acquisito", tone: "bg-success-50 text-success-700 border-success-200" },
  lost: { label: "Non acquisito", tone: "bg-danger-50 text-danger-700 border-danger-200" }
};

export const jobStatusMap: Record<JobStatus, { label: string; tone: string }> = {
  scheduled: { label: "Programmato", tone: "bg-warning-50 text-warning-700 border-warning-200" },
  on_the_way: { label: "In arrivo", tone: "bg-primary-50 text-primary-700 border-primary-200" },
  in_progress: { label: "In corso", tone: "bg-warning-100 text-warning-800 border-warning-200" },
  completed: { label: "Completato", tone: "bg-success-50 text-success-700 border-success-200" },
  canceled: { label: "Annullato", tone: "bg-danger-50 text-danger-700 border-danger-200" }
};

export const estimateStatusMap: Record<EstimateStatus, { label: string; tone: string }> = {
  draft: { label: "Bozza", tone: "bg-neutral-100 text-neutral-700 border-neutral-200" },
  sent: { label: "Inviato", tone: "bg-primary-50 text-primary-700 border-primary-200" },
  viewed: { label: "Visto", tone: "bg-warning-50 text-warning-700 border-warning-200" },
  accepted: { label: "Accettato", tone: "bg-success-50 text-success-700 border-success-200" },
  rejected: { label: "Rifiutato", tone: "bg-danger-50 text-danger-700 border-danger-200" },
  expired: { label: "Scaduto", tone: "bg-neutral-100 text-neutral-700 border-neutral-200" }
};

export const invoiceStatusMap: Record<InvoiceStatus, { label: string; tone: string }> = {
  draft: { label: "Bozza", tone: "bg-neutral-100 text-neutral-700 border-neutral-200" },
  sent: { label: "Inviata", tone: "bg-primary-50 text-primary-700 border-primary-200" },
  paid: { label: "Pagata", tone: "bg-success-50 text-success-700 border-success-200" },
  overdue: { label: "Scaduta", tone: "bg-danger-50 text-danger-700 border-danger-200" },
  void: { label: "Annullata", tone: "bg-neutral-100 text-neutral-700 border-neutral-200" }
};

export const toastMessages = [
  "Richiesta salvata",
  "Appuntamento creato",
  "Preventivo aggiornato",
  "Preventivo inviato",
  "Fattura inviata",
  "Fattura segnata come pagata",
  "Automazione attivata",
  "Modifiche salvate"
] as const;
