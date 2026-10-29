import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getTeamPageData(companyId: string) {
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });

  const users = await prisma.user.findMany({
    where: {
      companyId: company.id
    },
    orderBy: [{ role: "asc" }, { name: "asc" }]
  });

  return {
    company,
    users
  };
}

export async function updateUserHourlyCost(
  companyId: string,
  userId: string,
  input: {
    hourlyCost: number | null;
  }
) {
  await prisma.user.findFirstOrThrow({ where: { id: userId, companyId } });
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      hourlyCost: input.hourlyCost
    }
  });

  await prisma.activityLog.create({
    data: {
      companyId: user.companyId,
      entityType: "user",
      entityId: user.id,
      eventType: "team_hourly_cost_updated",
      metadataJson: {
        message:
          user.role === UserRole.WORKER
            ? `Costo orario aggiornato per ${user.name}.`
            : `Costo orario owner aggiornato per ${user.name}.`,
        hourlyCost: user.hourlyCost
      }
    }
  });

  return user;
}
