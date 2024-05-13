import { deleteServerUser, listServerUsers, updateServerUser } from "@/lib/users";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { usersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { throwErr } from "@stackframe/stack-shared/dist/utils/errors";

export const usersCrudHandlers = createCrudHandlers(usersCrud, {
  paramNames: ["userId"] as const,
  async onRead({ auth, params }) {
    const userId = params.userId;
    const projectId = auth?.project.id;
    if (!projectId || !userId) throw new KnownErrors.UserNotFound();

    return await updateServerUser(
      projectId,
      userId,
      {},
    ) ?? throwErr(new KnownErrors.UserNotFound());
  },
  async onUpdate({ auth, data, params }) {
    const userId = params.userId;
    const projectId = auth?.project.id;
    if (!projectId || !userId) throw new KnownErrors.UserNotFound();

    return await updateServerUser(
      projectId,
      userId,
      data,
    ) ?? throwErr(new KnownErrors.UserNotFound());
  },
  async onDelete({ auth, params }) {
    const userId = params.userId;
    const projectId = auth?.project.id;
    if (!projectId || !userId) throw new KnownErrors.UserNotFound();

    await deleteServerUser(projectId, userId);
  },
  async onList({ auth }) {
    const projectId = auth?.project.id;
    if (!projectId) throw new KnownErrors.UserNotFound();

    return await listServerUsers(projectId);
  }
});
