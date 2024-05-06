import PageClient from "./page-client";

export default function Page({ params }: { params: { teamId: string } }) {
  return <PageClient teamId={params.teamId}/>;
}