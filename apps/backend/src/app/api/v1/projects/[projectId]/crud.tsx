import { createPrismaCrudHandlers } from "@/route-handlers/prisma-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { projectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { typedToLowercase } from "@stackframe/stack-shared/dist/utils/strings";
import { ProxiedOAuthProviderType } from "@prisma/client";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";

export const projectsCrudHandlers = createPrismaCrudHandlers(projectsCrud, "project", {
  paramsSchema: yupObject({
    projectId: yupString().required(),
  }),
  baseFields: async ({ params }) => ({
    id: params.projectId,
  }),
  include: async () => ({
    config: {
      include: {
        oauthProviderConfigs: {
          include: {
            proxiedOAuthConfig: true,
            standardOAuthConfig: true,
          },
        },
      },
    },
  }),
  notFoundError: () => new KnownErrors.ProjectNotFound(),
  crudToPrisma: async () => {
    throw new StackAssertionError("This handler only supports read operations, this should never be called");
  },
  prismaToCrud: async (prisma) => {
    return {
      id: prisma.id,
      display_name: prisma.displayName,
      description: prisma.description || undefined,
      config: {
        credential_enabled: prisma.config.credentialEnabled,
        magic_link_enabled: prisma.config.magicLinkEnabled,
        oauth_providers: prisma.config.oauthProviderConfigs.flatMap((provider): { id: Lowercase<ProxiedOAuthProviderType> }[] => {
          if (provider.proxiedOAuthConfig) {
            return [{ id: typedToLowercase(provider.proxiedOAuthConfig.type) }];
          } else if (provider.standardOAuthConfig) {
            return [{ id: typedToLowercase(provider.standardOAuthConfig.type) }];
          } else {
            throw new StackAssertionError(`Exactly one of the provider configs should be set on provider config '${provider.id}' of project '${prisma.id}'`, { prisma });
          }
        }).sort((a, b) => a.id.localeCompare(b.id)),
      }
    };
  },
});
