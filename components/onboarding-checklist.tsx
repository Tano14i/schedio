import { prisma } from "@/lib/prisma";
import { getWhatsAppConnectionStatus } from "@/lib/whatsapp-config";
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  FileText,
  MessageCircle,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

async function getOnboardingStatus(companyId: string) {
  const [company, customerCount, estimateCount, userCount] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { trade: true } }),
    prisma.customer.count({ where: { companyId } }),
    prisma.estimate.count({ where: { companyId } }),
    prisma.user.count({ where: { companyId } }),
  ]);

  const { cloudApiReady } = getWhatsAppConnectionStatus();

  return {
    tradeSet: Boolean(company?.trade),
    hasCustomers: customerCount > 0,
    hasEstimates: estimateCount > 0,
    whatsappReady: cloudApiReady,
    hasTeam: userCount > 1,
  };
}

export async function OnboardingChecklist({ companyId }: { companyId: string }) {
  const s = await getOnboardingStatus(companyId);

  // Scompare automaticamente quando i 3 passi obbligatori sono completati
  if (s.tradeSet && s.hasCustomers && s.hasEstimates) return null;

  const steps = [
    {
      id: "trade",
      Icon: Briefcase,
      title: "Aggiungi il tuo mestiere",
      description: "Specifica la tua specializzazione per personalizzare Schedio.",
      href: "/settings",
      completed: s.tradeSet,
      optional: false,
    },
    {
      id: "customer",
      Icon: Users,
      title: "Crea il tuo primo cliente",
      description: "Aggiungi un cliente al tuo archivio per iniziare a lavorare.",
      href: "/customers",
      completed: s.hasCustomers,
      optional: false,
    },
    {
      id: "estimate",
      Icon: FileText,
      title: "Manda il tuo primo preventivo",
      description: "Crea e invia un preventivo professionale al tuo cliente.",
      href: "/estimates",
      completed: s.hasEstimates,
      optional: false,
    },
    {
      id: "whatsapp",
      Icon: MessageCircle,
      title: "Connetti WhatsApp",
      description: "Ricevi richieste direttamente su WhatsApp Business.",
      href: "/settings",
      completed: s.whatsappReady,
      optional: true,
    },
    {
      id: "team",
      Icon: UserPlus,
      title: "Invita un collaboratore",
      description: "Aggiungi un membro del team per lavorare insieme.",
      href: "/settings/team",
      completed: s.hasTeam,
      optional: true,
    },
  ];

  const completedCount = steps.filter((step) => step.completed).length;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Inizia con Schedio</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {completedCount} di {steps.length} passi completati
          </p>
        </div>
        <div className="h-1.5 w-28 flex-shrink-0 overflow-hidden rounded-full bg-amber-100">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <ul className="space-y-1.5">
        {steps.map(({ id, Icon, title, description, href, completed, optional }) => (
          <li key={id}>
            <Link
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                completed
                  ? "opacity-50 hover:opacity-70"
                  : "border border-amber-100 bg-white shadow-sm hover:border-amber-300"
              }`}
            >
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                  completed ? "bg-green-100" : "bg-amber-100"
                }`}
              >
                {completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Icon className="h-4 w-4 text-amber-600" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium leading-snug ${
                    completed ? "text-gray-400 line-through" : "text-gray-900"
                  }`}
                >
                  {title}
                  {optional && (
                    <span className="ml-1.5 text-xs font-normal text-gray-400">(facoltativo)</span>
                  )}
                </p>
                {!completed && (
                  <p className="truncate text-xs text-gray-500">{description}</p>
                )}
              </div>

              {!completed && <ChevronRight className="h-4 w-4 flex-shrink-0 text-amber-400" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
