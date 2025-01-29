import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { omit } from "@stackframe/stack-shared/dist/utils/objects";
import { ObjectSchema } from "yup";
import { GET as LatestBreakingChange } from "../../latest/breaking-change/route";


export const GET = createSmartRouteHandler({
  ...LatestBreakingChange.initArgs[0],
  request: LatestBreakingChange.initArgs[0].request.concat(yupObject({
    query: (LatestBreakingChange.initArgs[0].request.getNested("query") as ObjectSchema<{ l: string }, any, any, "">).omit(["l"]).concat(yupObject({
      q: yupString().defined(),
    }).defined()),
  }).defined()),
  response: LatestBreakingChange.initArgs[0].response,
  handler: async (req, fullReq) => {
    return await LatestBreakingChange.invoke({
      ...fullReq,
      query: {
        ...omit(fullReq.query, ["q"]),
        l: req.query.q,
      },
    });
  },
});
