import { interaction_route, oidc } from "@/idp/idp";
import { IncomingMessage, ServerResponse } from "http";
import { NextApiRequest } from "next";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";


export async function GET(req: NextRequest) {

  console.log(req);

  let body = "";

  const next_response = new NextResponse();
  const res = {
    ...next_response,
    removeHeader: (key: string) => {
      console.log('removeHeader', key);
      next_response.headers.delete(key);
    },
    setHeader: (key: string, value: string) => {
      console.log('setHeader', key, value);
      next_response.headers.set(key, value);
    },
    end: (chunk: any, encoding: any, callback: any) => {
      console.log('end', chunk);
      body += chunk;
    },
  };


  const x = await oidc.callback()(req as unknown as IncomingMessage, res as unknown as ServerResponse);

  const finalResponse = new NextResponse(body);
  next_response.headers.forEach((value, key) => {
    finalResponse.headers.set(key, value);
  });

  return finalResponse;
}
