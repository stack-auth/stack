"use client";
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { FormSettingCard, SettingCard, SettingInput, SettingSwitch } from "@/components/settings";
import { Alert } from "@/components/ui/alert";
import { StyledLink } from "@/components/link";
import * as yup from "yup";
import { InputField } from "@/components/form-fields";
import Typography from "@/components/ui/typography";

const projectInformationSchema = yup.object().shape({
  displayName: yup.string().required(),
  description: yup.string(),
});


export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();
  const productionModeErrors = project.getProductionModeErrors();

  return (
    <PageLayout title="Project Settings" description="Manage your project">
      <SettingCard title="Production mode" description="Production mode disallows certain configuration options that are useful for development but deemed unsafe for production usage. To prevent accidental misconfigurations, it is strongly recommended to enable production mode on your production environments.">
        <SettingSwitch
          label="Enable production mode"
          checked={project.isProductionMode}
          disabled={!project.isProductionMode && productionModeErrors.length > 0}
          onCheckedChange={async (checked) => { await project.update({ isProductionMode: checked }); }}
        />

        {productionModeErrors.length === 0 ? (
          <Alert>
            Your configuration is ready for production and production mode can be enabled. Good job!
          </Alert>
        ) : (
          <Alert variant='destructive'>
            Your configuration is not ready for production mode. Please fix the following issues:
            <ul className="mt-2 list-disc pl-5">
              {productionModeErrors.map((error) => (
                <li key={error.errorMessage}>
                  {error.errorMessage} (<StyledLink href={error.fixUrlRelative}>show configuration</StyledLink>)
                </li>
              ))}
            </ul>
          </Alert>
        )}
      </SettingCard>

      <FormSettingCard 
        title="Project Information"
        defaultValues={project}
        formSchema={projectInformationSchema}
        onSubmit={async (values) => { await project.update(values); }}
        render={(form) => (
          <>
            <InputField label="Display Name" control={form.control} name="displayName" required />
            <InputField label="Description" control={form.control} name="description" />

            <Typography variant="secondary" type="footnote">
              The display name and description may be publicly visible to the users of your app.
            </Typography>
          </>
        )}
      />
    </PageLayout>
  );
}
