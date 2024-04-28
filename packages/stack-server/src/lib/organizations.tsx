import { prismaClient } from "@/prisma-client";
import { listServerUsers } from "./users";
import { OrganizationJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ServerOrganizationCustomizableJson, ServerOrganizationJson } from "@stackframe/stack-shared/dist/interface/serverInterface";
import { filterUndefined } from "@stackframe/stack-shared/dist/utils/objects";
import { Prisma } from "@prisma/client";

export const fullOrganizationInclude = {} as const satisfies Prisma.OrganizationInclude;


export async function getOrganizations(projectId: string): Promise<OrganizationJson[]> {
  return await getServerOrganizations(projectId);
}

export async function getServerOrganizations(projectId: string): Promise<ServerOrganizationJson[]> {
  const result = await prismaClient.organization.findMany({
    where: {
      projectId,
    },
    include: fullOrganizationInclude,
  });
  return result.map(organization => ({
    id: organization.organizationId,
    displayName: organization.displayName,
    createdAtMillis: organization.createdAt.getTime(),
  }));
}

export async function listServerMembers(projectId: string, organizationId: string): Promise<string[]> {
  // TODO more efficient filtering
  const users = await listServerUsers(projectId);
  return users.filter(user => user.organization?.id === organizationId).map(user => user.id);
}

export async function getOrganization(projectId: string, organizationId: string): Promise<OrganizationJson | null> {
  // TODO more efficient filtering
  const organizations = await getOrganizations(projectId);
  return organizations.find(organization => organization.id === organizationId) || null;
}

export async function getServerOrganization(projectId: string, organizationId: string): Promise<ServerOrganizationJson | null> {
  // TODO more efficient filtering
  const organizations = await getServerOrganizations(projectId);
  return organizations.find(organization => organization.id === organizationId) || null;
}

export async function updateServerOrganization(projectId: string, organizationId: string, update: ServerOrganizationCustomizableJson): Promise<void> {
  await prismaClient.organization.update({
    where: {
      projectId_organizationId: {
        projectId,
        organizationId,
      },
    },
    data: filterUndefined({
      displayName: update.displayName,
    }),
  });
}

export async function createServerOrganization(projectId: string, organization: ServerOrganizationCustomizableJson): Promise<ServerOrganizationJson> {
  const result = await prismaClient.organization.create({
    data: {
      projectId,
      displayName: organization.displayName,
    },
    include: fullOrganizationInclude,
  });
  return {
    id: result.organizationId,
    displayName: result.displayName,
    createdAtMillis: result.createdAt.getTime(),
  };
}

export async function deleteServerOrganization(projectId: string, organizationId: string): Promise<void> {
  const deleted = await prismaClient.organization.delete({
    where: {
      projectId_organizationId: {
        projectId,
        organizationId,
      },
    },
  });
  if (!deleted) {
    throw new Error("Organization not found");
  }
}
