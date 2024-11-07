import PageClient from "./page-client";

export const metadata = {
  title: "User Profile",
};

export default async function Page(props: { params: { userId: string } }) {
  return (
    <PageClient userId={props.params.userId} />
  );
}
