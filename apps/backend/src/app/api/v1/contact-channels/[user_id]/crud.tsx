import { ensureContactChannelDoesNotExists, ensureContactChannelExists } from "@/lib/request-checks";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { Prisma } from "@prisma/client";
import { KnownErrors } from "@stackframe/stack-shared";
import { contactChannelsCrud } from "@stackframe/stack-shared/dist/interface/crud/contact-channels";
import { userIdOrMeSchema, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";
import { typedToLowercase, typedToUppercase } from "@stackframe/stack-shared/dist/utils/strings";

export const contactChannelToCrud = (channel: Prisma.ContactChannelGetPayload<{}>) => {
  return {
    id: channel.id,
    type: typedToLowercase(channel.type),
    value: channel.value,
    is_primary: !!channel.isPrimary,
    is_verified: channel.isVerified,
    used_for_auth: !!channel.usedForAuth,
  } as const;
};


export const contactChannelsCrudHandlers = createLazyProxy(() => createCrudHandlers(contactChannelsCrud, {
  querySchema: yupObject({
    user_id: userIdOrMeSchema.required(),
    contact_channel_id: yupString().uuid().optional(),
  }),
  paramsSchema: yupObject({}),
  onCreate: async ({ query, auth, data }) => {
    if (auth.type === 'client') {
      const currentUserId = auth.user?.id || throwErr(new KnownErrors.CannotGetOwnUserWithoutUser());
      if (currentUserId !== query.user_id) {
        throw new StatusError(StatusError.Forbidden, 'Client can only create contact channels for their own user.');
      }
    }

    const contactChannel = await prismaClient.$transaction(async (tx) => {
      await ensureContactChannelDoesNotExists(tx, {
        projectId: auth.project.id,
        userId: query.user_id,
        type: data.type,
        value: data.value,
      });

      return await tx.contactChannel.create({
        data: {
          projectId: auth.project.id,
          projectUserId: query.user_id,
          type: typedToUppercase(data.type),
          value: data.value,
          isVerified: data.is_verified,
          usedForAuth: data.used_for_auth ? 'TRUE' : null,
        },
      });
    });

    return contactChannelToCrud(contactChannel);
  },
  onUpdate: async ({ query, auth, data }) => {
    if (auth.type === 'client') {
      const currentUserId = auth.user?.id || throwErr(new KnownErrors.CannotGetOwnUserWithoutUser());
      if (currentUserId !== query.user_id) {
        throw new StatusError(StatusError.Forbidden, 'Client can only update contact channels for their own user.');
      }
    }

    const contactChannel = await prismaClient.$transaction(async (tx) => {
      await ensureContactChannelExists(tx, {
        projectId: auth.project.id,
        userId: query.user_id,
        contactChannelId: query.contact_channel_id || throwErr("Missing contact channel id"),
      });

      return await tx.contactChannel.update({
        where: {
          projectId_projectUserId_id: {
            projectId: auth.project.id,
            projectUserId: query.user_id,
            id: query.contact_channel_id || throwErr("Missing contact channel id"),
          },
        },
        data: {
          type: data.type ? typedToUppercase(data.type) : undefined,
          value: data.value,
          isVerified: data.is_verified,
          usedForAuth: data.used_for_auth ? 'TRUE' : null,
        },
      });
    });

    return contactChannelToCrud(contactChannel);
  },
  onDelete: async ({ query, auth }) => {
    if (auth.type === 'client') {
      const currentUserId = auth.user?.id || throwErr(new KnownErrors.CannotGetOwnUserWithoutUser());
      if (currentUserId !== query.user_id) {
        throw new StatusError(StatusError.Forbidden, 'Client can only delete contact channels for their own user.');
      }
    }

    await prismaClient.$transaction(async (tx) => {
      await ensureContactChannelExists(tx, {
        projectId: auth.project.id,
        userId: query.user_id,
        contactChannelId: query.contact_channel_id || throwErr("Missing contact channel id"),
      });

      await tx.contactChannel.delete({
        where: {
          projectId_projectUserId_id: {
            projectId: auth.project.id,
            projectUserId: query.user_id,
            id: query.contact_channel_id || throwErr("Missing contact channel id"),
          },
        },
      });
    });
  },
}));
