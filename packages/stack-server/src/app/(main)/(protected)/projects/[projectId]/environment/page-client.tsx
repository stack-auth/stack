"use client";;
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { SettingCard, SettingSwitch } from "@/components/settings";
import { Alert } from "@/components/ui/alert";
import Typography from "@/components/ui/typography";
import { Link } from "@/components/link";

export default function EnvironmentClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();

  const productionModeErrors = project.getProductionModeErrors();

  return (
    <PageLayout title="Environment" description="Development and production settings">
      <SettingCard title="Production mode" description="Production mode disallows certain configuration options that are useful for development but deemed unsafe for production usage. To prevent accidental misconfigurations it is strongly recommended to enable production mode on your production environments.">
        <SettingSwitch
          label="Enable production mode"
          checked={project.isProductionMode}
          disabled={!project.isProductionMode && productionModeErrors.length > 0}
          onCheckedChange={async (checked) => {
            await project.update({
              isProductionMode: checked,
            });
          }}
        />

        {productionModeErrors.length === 0 ? (
          <Alert>
            Your configuration is ready for production and production mode can be enabled. Good job!
          </Alert>
        ) : (
          <Alert variant='destructive'>
            <Typography variant="destructive">Your configuration is not ready for production mode. Please fix the following issues:</Typography>
            <ul className="mt-2 list-disc pl-5">
              {productionModeErrors.map((error) => (
                <li key={error.errorMessage}>
                  {error.errorMessage} (<Link href={error.fixUrlRelative}>show configuration</Link>)
                </li>
              ))}
            </ul>
          </Alert>
        )}
      </SettingCard>
    </PageLayout>
  );
}
