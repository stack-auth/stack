import { AdminAppProvider } from "./use-admin-app";
import { OnboardingDialog } from "./onboarding-dialog";
import SidebarLayout from "./sidebar-layout";

export default function Layout(props: { children: React.ReactNode, params: { projectId: string } }) {
  return (
    <AdminAppProvider projectId={props.params.projectId}>
      <OnboardingDialog />
      <SidebarLayout params={props.params}>
        {props.children}
      </SidebarLayout>
    </AdminAppProvider>
  );
}
