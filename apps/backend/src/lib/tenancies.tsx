import { prismaClient } from "@/prisma-client";
import { Prisma } from "@prisma/client";
import { fullProjectInclude, projectPrismaToCrud } from "./projects";

export const fullTenancyInclude = {
  project: {
    include: fullProjectInclude,
  },
} as const satisfies Prisma.TenancyInclude;

export function tenancyPrismaToCrud(prisma: Prisma.TenancyGetPayload<{ include: typeof fullTenancyInclude }>) {
  const projectCrud = projectPrismaToCrud(prisma.project);
  return {
    id: prisma.id,
    config: projectCrud.config,
    branchId: prisma.branchId,
    organization: {
      // TODO actual organization type
      id: prisma.organizationId,
    },
    project: projectCrud,
  };
}

export type Tenancy = Awaited<ReturnType<typeof tenancyPrismaToCrud>>;

/**
  * @deprecated This is a temporary function for the situation where every project has exactly one tenancy. Later,
  * we will support multiple tenancies per project, and all uses of this function will be refactored.
  */
export async function getDefaultTenancyFromProject(projectId: string) {
  const tenancy = await getTenancyFromProject(projectId, 'main', null);
  if (!tenancy) {
    throw new StackAssertionError("No tenancy found for project", { projectId });
  }
  return tenancy;
}

export async function getTenancy(tenancyId: string) {
  const prisma = await prismaClient.tenancy.findUniqueOrThrow({
    where: { id: tenancyId },
    include: fullTenancyInclude,
  });
  if (!prisma) return null;
  return tenancyPrismaToCrud(prisma);
}

export async function getTenancyFromProject(projectId: string, branchId: string, organizationId: string | null) {
  const prisma = await prismaClient.tenancy.findUniqueOrThrow({
    where: {
      ...(organizationId === null ? {
        projectId_branchId_hasNoOrganization: {
          projectId: projectId,
          branchId: branchId,
          hasNoOrganization: "TRUE",
        }
      } : {
        projectId_branchId_organizationId: {
          projectId: projectId,
          branchId: branchId,
          organizationId: organizationId,
        }
      }),
    },
    include: fullTenancyInclude,
  });
  if (!prisma) return null;
  return tenancyPrismaToCrud(prisma);
}

