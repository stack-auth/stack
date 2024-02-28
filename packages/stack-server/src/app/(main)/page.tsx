import { Metadata } from "next";
import { Paragraph } from "@/components/paragraph";
import { SmartLink } from "@/components/smart-link";
import { stackServerApp } from "@/stack";

export const metadata: Metadata = {
  title: "Landing Page",
};

export default async function Home() {
  const user = await stackServerApp.getUser();
  return (
    <>
      <Paragraph h1>
        Landing Page
      </Paragraph>

      <Paragraph body>
        {user ? (
          <SmartLink href="/projects">
          Dashboard
          </SmartLink>
        ) : (
          <SmartLink href={stackServerApp.urls.signIn}>
          Sign In
          </SmartLink>
        )}
      </Paragraph>
    </>
  );
}
