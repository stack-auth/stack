"use client";
import { InputField } from "@/components/form-fields";
import { StyledLink } from "@/components/link";
import { FormSettingCard, SettingCard, SettingSwitch } from "@/components/settings";
import { Alert, Typography } from "@stackframe/stack-ui";
import * as yup from "yup";
import { PageLayout } from "../page-layout";
import { useAdminApp } from "../use-admin-app";

const projectInformationSchema = yup.object().shape({
  displayName: yup.string().required(),
  description: yup.string(),
});


export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProject();
  const productionModeErrors = project.useProductionModeErrors();

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
                <li key={error.message}>
                  {error.message} (<StyledLink href={error.relativeFixUrl}>show configuration</StyledLink>)
                </li>
              ))}
            </ul>
          </Alert>
        )}
      </SettingCard>

      <FormSettingCard
        title="Project Information"
        defaultValues={{
          displayName: project.displayName,
          description: project.description || undefined,
        }}
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
