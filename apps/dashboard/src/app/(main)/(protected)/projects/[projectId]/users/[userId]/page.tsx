import PageClient from "./page-client";

export const metadata = {
  title: "User Details",
};

export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>,
}) {
  const awaitedParams = await params;
  return (
    <PageClient userId={awaitedParams.userId} />
  );
}
