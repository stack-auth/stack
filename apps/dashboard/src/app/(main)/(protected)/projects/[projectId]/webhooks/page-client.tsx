"use client";

import { PageLayout } from "../page-layout";
import { useAdminApp } from "../use-admin-app";
import { SvixProvider, useEndpoints } from "svix-react";

function AppPortal() {
  const endpoints = useEndpoints();

  return (
    <div>
      {endpoints.error && <div>An error has occurred</div>}
      {endpoints.loading && <div>Loading...</div>}
      <ul>
        {endpoints.data?.map((endpoint) => (
          <li key={endpoint.id}>{endpoint.url}</li>
        ))}
      </ul>
      <button disabled={!endpoints.hasPrevPage} onClick={endpoints.prevPage}>
        Previous Page
      </button>
      <button disabled={!endpoints.hasNextPage} onClick={endpoints.nextPage}>
        Next Page
      </button>
    </div>
  );
}


export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const svixToken = stackAdminApp.useSvixToken();

  return (
    <PageLayout title="Users">
      <SvixProvider
        token={svixToken}
        appId={stackAdminApp.projectId}
        options={{ serverUrl: process.env.NEXT_PUBLIC_STACK_SVIX_SERVER_URL }}
      >
        <AppPortal />
      </SvixProvider>
    </PageLayout>
  );
}
