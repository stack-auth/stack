import { CrudTypeOf, createCrud } from "../../crud";
import { yupObject, yupString } from "../../schema-fields";

export const jwtCrudClientCreateSchema = yupObject({});

export const jwtCrudClientReadSchema = yupObject({
  token: yupString().required(),
});

export const jwtCrud = createCrud({
  clientCreateSchema: jwtCrudClientCreateSchema,
  clientReadSchema: jwtCrudClientReadSchema,
  docs: {
    clientCreate: {
      // TODO: add to API list after it is getting stable
      hidden: true
    },
  },
});
export type JwtCrud = CrudTypeOf<typeof jwtCrud>;
