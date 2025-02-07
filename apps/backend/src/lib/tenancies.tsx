import { prismaClient } from "@/prisma-client";
import { Prisma } from "@prisma/client";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { fullProjectInclude, projectPrismaToCrud } from "./projects";

export const fullTenancyInclude = {
  project: {
    include: fullProjectInclude,
  },
} as const satisfies Prisma.TenancyInclude;

export function tenancyPrismaToCrud(prisma: Prisma.TenancyGetPayload<{ include: typeof fullTenancyInclude }>) {
  if (prisma.hasNoOrganization && prisma.organizationId !== null) {
    throw new StackAssertionError("Organization ID is not null for a tenancy with hasNoOrganization", { tenancyId: prisma.id, prisma });
  }
  if (!prisma.hasNoOrganization && prisma.organizationId === null) {
    throw new StackAssertionError("Organization ID is null for a tenancy without hasNoOrganization", { tenancyId: prisma.id, prisma });
  }

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
export async function getSoleTenancyFromProject(projectId: string) {
  const tenancy = await getTenancyFromProject(projectId, 'main', null);
  if (!tenancy) {
    throw new StackAssertionError("No tenancy found for project", { projectId });
  }
  return tenancy;
}

export async function getTenancy(tenancyId: string) {
  const prisma = await prismaClient.tenancy.findUnique({
    where: { id: tenancyId },
    include: fullTenancyInclude,
  });
  if (!prisma) return null;
  return tenancyPrismaToCrud(prisma);
}

export async function getTenancyFromProject(projectId: string, branchId: string, organizationId: string | null) {
  const prisma = await prismaClient.tenancy.findUnique({
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

