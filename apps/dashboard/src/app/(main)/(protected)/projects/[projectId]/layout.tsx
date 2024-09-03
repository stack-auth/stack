import { OnboardingDialog } from "./onboarding-dialog";
import SidebarLayout from "./sidebar-layout";
import { AdminAppProvider } from "./use-admin-app";

export default function Layout(props: { children: React.ReactNode; params: { projectId: string } }) {
  return (
    <AdminAppProvider projectId={props.params.projectId}>
      <OnboardingDialog />
      <SidebarLayout projectId={props.params.projectId}>{props.children}</SidebarLayout>
    </AdminAppProvider>
  );
}
