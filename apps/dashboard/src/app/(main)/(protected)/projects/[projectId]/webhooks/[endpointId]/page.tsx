import PageClient from "./page-client";

export const metadata = {
  title: "Webhook Endpoint",
};

export default function Page({ params }: { params: { endpointId: string } }) {
  return <PageClient endpointId={params.endpointId} />;
}
