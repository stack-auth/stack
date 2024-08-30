import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { getIdFromUserIdOrMe } from "@/route-handlers/utils";
import { jwtCrud } from "@stackframe/stack-shared/dist/interface/crud/jwt";
import { userIdOrMeSchema, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";
import * as jose from "jose";
const { createSecretKey } = require('crypto');


export const jwtCrudHandlers = createLazyProxy(() => createCrudHandlers(jwtCrud, {
  paramsSchema: yupObject({
    user_id: userIdOrMeSchema.required(),
    schema_id: yupString().required(),
  }),
  onCreate: async ({ auth, params }) => {
    const userId = getIdFromUserIdOrMe(params.user_id, auth.user);

    if (auth.type === 'client' && auth.user?.id !== userId) {
      throw new StatusError(StatusError.Forbidden, "Client can only create its own JWT");
    }

    const token = await new jose.SignJWT({
      project_id: auth.project.id,
      user_id: userId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(new Date(Date.now() + 1000 * 60 * 60)) // 1 hour
      .sign(createSecretKey('test', 'utf-8'));

    return { token };
  },
}));