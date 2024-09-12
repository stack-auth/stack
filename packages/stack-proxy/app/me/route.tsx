import { stackServerApp } from "@/stack";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const user = await stackServerApp.getUser();

  if (!user) {
    return NextResponse.json(
      { user: null, authenticated: false },
      { status: 401 }
    );
  } else {
    return NextResponse.json(
      {
        user: {
          id: user.id,
          primary_email: user.primaryEmail,
          display_name: user.displayName,
        },
        authenticated: true,
      },
      { status: 200 }
    );
  }
};
