import { updateServerUser } from "@/lib/users";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { currentUserCrud } from "@stackframe/stack-shared/dist/interface/crud/current-user";

export const currentUserCrudHandlers = createCrudHandlers(currentUserCrud, {
  paramNames: [],
  async onRead({ auth }) {
    let user = auth.user ?? null;
    if (user) {
      user = {
        ...user,
        oauthProviders: user.oauthProviders.map((provider) => ({
          providerId: provider,
          accountId: "none",
          email: "something@example.com",
        })) as any,
      };
    }
    return user;
  },
  async onUpdate({ auth, data }) {
    const userId = auth.user?.id;
    const projectId = auth.project.id;
    if (!projectId || !userId) throw new KnownErrors.UserNotFound();

    let user = await updateServerUser(
      projectId,
      userId,
      data,
    );
    if (!user) throw new KnownErrors.UserNotFound();
    user = {
      ...user,
      oauthProviders: user.oauthProviders.map((provider) => ({
        providerId: provider,
        accountId: "none",
        email: "something@example.com",
      })) as any,
    };
    return user;
  },
  async onDelete({ auth }) {
    throw new Error("not supported");
  },
  metadataMap: {
    read: {
      summary: 'Get the current user',
      description: 'Get user by session',
      tags: ['Users'],
    },
    update: {
      summary: 'Update the current user',
      description: 'Update user by session. Only the values provided will be updated',
      tags: ['Users'],
    },
  },
});
