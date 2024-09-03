import { notFound } from "next/navigation";
import { emailTemplateTypes } from "@stackframe/stack-shared/dist/interface/crud/email-templates";
import PageClient from "./page-client";

export const metadata = {
  title: "Email Template",
};

export default function Page({ params }: { params: { type: string } }) {
  if (!emailTemplateTypes.includes(params.type as any)) {
    return notFound();
  }

  return <PageClient templateType={params.type as any} />;
}
