import { stackServerApp } from "@/stack";
import { redirect } from "next/navigation";
import Footer from "./footer";
import PageClient from "./page-client";
import { neverResolve } from "@stackframe/stack-shared/dist/utils/promises";

export const metadata = {
  title: "Projects",
};

export default async function Page() {
  const user = await stackServerApp.getUser();
  if (user) {
    const projects = await user.listOwnedProjects();
    if (projects.length === 0) {
      redirect("/new-project");
    }
  }

  return (
    <>
      <PageClient />
      <Footer />
    </>
  );
}
