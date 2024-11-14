"use client";

import NotFound from "@/app/not-found";
import * as yup from "yup";
import { PageLayout } from "../../page-layout";
import { useAdminApp } from "../../use-admin-app";


export default function PageClient(props: { userId: string }) {
  const stackAdminApp = useAdminApp();

  if (!yup.string().uuid().isValidSync(props.userId)) {
    return <NotFound />;
  }

  const user = stackAdminApp.useUser(props.userId);

  if (!user) {
    return <NotFound />;
  }

  return (
    <PageLayout title="User Profile" width="md">
      test
    </PageLayout>
  );
}
