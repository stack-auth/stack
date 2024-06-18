import { emailTemplateTypes } from "@stackframe/stack-shared/dist/interface/serverInterface";
import PageClient from "./page-client";
import { notFound } from "next/navigation";

export const metadata = {
  title: 'Email Template',
};

export default function Page({ params }: { params: { type: string } }) {
  if (!emailTemplateTypes.includes(params.type as any)) {
    return notFound();
  }

  return <PageClient templateType={params.type as any} />;
}