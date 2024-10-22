import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { svixTokenCrud } from "@stackframe/stack-shared/dist/interface/crud/svix-token";
import { yupObject } from "@stackframe/stack-shared/dist/schema-fields";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";
import { Svix } from "svix";

const appPortalCrudHandlers = createLazyProxy(() => createCrudHandlers(svixTokenCrud, {
  paramsSchema: yupObject({}),
  onCreate: async ({ auth }) => {
    const svix = new Svix(
      getEnvVariable("STACK_SVIX_API_KEY"),
      { serverUrl: getEnvVariable("STACK_SVIX_SERVER_URL", "") || undefined }
    );
    await svix.application.getOrCreate({ uid: auth.project.id, name: auth.project.id });
    const result = await svix.authentication.appPortalAccess(auth.project.id, {});
    return { token: result.token };
  },
}));

export const POST = appPortalCrudHandlers.createHandler;
