import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { GET as LatestBreakingChange } from "../../latest/breaking-change/route";


export const GET = createSmartRouteHandler({
  ...LatestBreakingChange.initArgs[0],
  request: LatestBreakingChange.initArgs[0].request.concat(yupObject({
    query: LatestBreakingChange.initArgs[0].request.getNested("query").concat(yupObject({
      q: yupString().optional(),
    }).defined()),
  }).defined()),
  response: LatestBreakingChange.initArgs[0].response,
  handler: async (req, fullReq) => {
    return await LatestBreakingChange.invoke({
      ...fullReq,
      query: {
        ...fullReq.query,
        q: "DEFAULT_VALUE",
      },
    });
  },
});
