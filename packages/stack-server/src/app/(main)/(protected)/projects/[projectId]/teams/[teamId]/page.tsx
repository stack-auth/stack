import ClientPage from "./page-client";

export const metadata = {
  title: "Team Members",
};

export default function Page({ params }: { params: { teamId: string } }) {
  return (
    <ClientPage teamId={params.teamId} />
  );
}