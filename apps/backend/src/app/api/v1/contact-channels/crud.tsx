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
    user_id: channel.projectUserId,
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
    user_id: userIdOrMeSchema.optional(),
    contact_channel_id: yupString().uuid().optional(),
  }),
  paramsSchema: yupObject({
    user_id: userIdOrMeSchema.required(),
    contact_channel_id: yupString().uuid().required(),
  }),
  onRead: async ({ params, auth }) => {
    if (auth.type === 'client') {
      const currentUserId = auth.user?.id || throwErr(new KnownErrors.CannotGetOwnUserWithoutUser());
      if (currentUserId !== params.user_id) {
        throw new StatusError(StatusError.Forbidden, 'Client can only read contact channels for their own user.');
      }
    }

    const contactChannel = await prismaClient.contactChannel.findUnique({
      where: {
        projectId_projectUserId_id: {
          projectId: auth.project.id,
          projectUserId: params.user_id,
          id: params.contact_channel_id || throwErr("Missing contact channel id"),
        },
      },
    });

    if (!contactChannel) {
      throw new StatusError(StatusError.NotFound, 'Contact channel not found.');
    }

    return contactChannelToCrud(contactChannel);
  },
  onCreate: async ({ auth, data }) => {
    if (auth.type === 'client') {
      const currentUserId = auth.user?.id || throwErr(new KnownErrors.CannotGetOwnUserWithoutUser());
      if (currentUserId !== data.user_id) {
        throw new StatusError(StatusError.Forbidden, 'Client can only create contact channels for their own user.');
      }
    }

    const contactChannel = await prismaClient.$transaction(async (tx) => {
      await ensureContactChannelDoesNotExists(tx, {
        projectId: auth.project.id,
        userId: data.user_id,
        type: data.type,
        value: data.value,
      });

      const createdContactChannel = await tx.contactChannel.create({
        data: {
          projectId: auth.project.id,
          projectUserId: data.user_id,
          type: typedToUppercase(data.type),
          value: data.value,
          isVerified: data.is_verified ?? false,
          usedForAuth: data.used_for_auth ? 'TRUE' : null,
        },
      });

      if (data.is_primary) {
        // mark all other channels as not primary
        await tx.contactChannel.updateMany({
          where: {
            projectId: auth.project.id,
            projectUserId: data.user_id,
          },
          data: {
            isPrimary: null,
          },
        });

        await tx.contactChannel.update({
          where: {
            projectId_projectUserId_id: {
              projectId: auth.project.id,
              projectUserId: data.user_id,
              id: createdContactChannel.id,
            },
          },
          data: {
            isPrimary: 'TRUE',
          },
        });
      }

      return await tx.contactChannel.findUnique({
        where: {
          projectId_projectUserId_id: {
            projectId: auth.project.id,
            projectUserId: data.user_id,
            id: createdContactChannel.id,
          },
        },
      }) || throwErr("Failed to create contact channel");
    });

    return contactChannelToCrud(contactChannel);
  },
  onUpdate: async ({ params, auth, data }) => {
    if (auth.type === 'client') {
      const currentUserId = auth.user?.id || throwErr(new KnownErrors.CannotGetOwnUserWithoutUser());
      if (currentUserId !== params.user_id) {
        throw new StatusError(StatusError.Forbidden, 'Client can only update contact channels for their own user.');
      }
    }

    const updatedContactChannel = await prismaClient.$transaction(async (tx) => {
      await ensureContactChannelExists(tx, {
        projectId: auth.project.id,
        userId: params.user_id,
        contactChannelId: params.contact_channel_id || throwErr("Missing contact channel id"),
      });

      if (data.is_primary) {
        // mark all other channels as not primary
        await tx.contactChannel.updateMany({
          where: {
            projectId: auth.project.id,
            projectUserId: params.user_id,
          },
          data: {
            isPrimary: null,
          },
        });
      }

      return await tx.contactChannel.update({
        where: {
          projectId_projectUserId_id: {
            projectId: auth.project.id,
            projectUserId: params.user_id,
            id: params.contact_channel_id || throwErr("Missing contact channel id"),
          },
        },
        data: {
          value: data.value,
          isVerified: data.is_verified ?? (data.value ? false : undefined), // if value is updated and is_verified is not provided, set to false
          usedForAuth: data.used_for_auth !== undefined ? (data.used_for_auth ? 'TRUE' : null) : undefined,
          isPrimary: data.is_primary !== undefined ? (data.is_primary ? 'TRUE' : null) : undefined,
        },
      });
    });

    return contactChannelToCrud(updatedContactChannel);
  },
  onDelete: async ({ params, auth }) => {
    if (auth.type === 'client') {
      const currentUserId = auth.user?.id || throwErr(new KnownErrors.CannotGetOwnUserWithoutUser());
      if (currentUserId !== params.user_id) {
        throw new StatusError(StatusError.Forbidden, 'Client can only delete contact channels for their own user.');
      }
    }

    await prismaClient.$transaction(async (tx) => {
      await ensureContactChannelExists(tx, {
        projectId: auth.project.id,
        userId: params.user_id,
        contactChannelId: params.contact_channel_id || throwErr("Missing contact channel id"),
      });

      await tx.contactChannel.delete({
        where: {
          projectId_projectUserId_id: {
            projectId: auth.project.id,
            projectUserId: params.user_id,
            id: params.contact_channel_id || throwErr("Missing contact channel id"),
          },
        },
      });
    });
  },
  onList: async ({ query, auth }) => {
    if (auth.type === 'client') {
      const currentUserId = auth.user?.id || throwErr(new KnownErrors.CannotGetOwnUserWithoutUser());
      if (currentUserId !== query.user_id) {
        throw new StatusError(StatusError.Forbidden, 'Client can only list contact channels for their own user.');
      }
    }

    const contactChannels = await prismaClient.contactChannel.findMany({
      where: {
        projectId: auth.project.id,
        projectUserId: query.user_id,
        id: query.contact_channel_id,
      },
    });

    return {
      items: contactChannels.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map(contactChannelToCrud),
      is_paginated: false,
    };
  }
}));
