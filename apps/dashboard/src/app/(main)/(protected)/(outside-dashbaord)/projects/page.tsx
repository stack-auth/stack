import PageClient from "./page-client";
import Footer from "./footer";
import { stackServerApp } from "@/stack";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Projects",
};

export default async function Page() {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect(stackServerApp.urls.signIn);
  }
  const projects = await user.listOwnedProjects();
  if (projects.length === 0) {
    redirect("/new-project");
  }
  
  return (
    <>
      <PageClient />
      <Footer />
    </>
  );
}