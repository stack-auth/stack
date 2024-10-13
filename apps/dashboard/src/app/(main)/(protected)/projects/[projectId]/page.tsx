import { redirect } from "next/navigation";

export default function Page({ params }: { params: { projectId: string } }) {
  redirect(`/projects/${params.projectId}/users`);
}
