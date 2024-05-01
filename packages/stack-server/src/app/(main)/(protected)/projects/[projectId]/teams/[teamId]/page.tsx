import ClientPage from "./page-client";

export default function Page({ params }: { params: { teamId: string } }) {
  return (
    <ClientPage teamId={params.teamId} />
  );
}