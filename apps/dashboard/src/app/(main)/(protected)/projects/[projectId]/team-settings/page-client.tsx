"use client";
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { SettingCard, SettingSwitch } from "@/components/settings";
import Typography from "@/components/ui/typography";
import { SmartFormDialog } from "@/components/form-dialog";
import { PermissionListField } from "@/components/permission-field";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function CreateDialog(props: {
  trigger: React.ReactNode,
  type: "creator" | "member",
}) {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProject();
  const permissions = stackAdminApp.useTeamPermissionDefinitions();
  const selectedPermissionIds = props.type === "creator" ?
    project.config.teamCreatorDefaultPermissions.map(x => x.id) :
    project.config.teamMemberDefaultPermissions.map(x => x.id);

  const formSchema = yup.object({
    permissions: yup.array().of(yup.string().required()).required().meta({
      stackFormFieldRender: (props) => (
        <PermissionListField
          {...props}
          permissions={permissions}
          selectedPermissionIds={selectedPermissionIds}
          type="select"
          label="Default Permissions"
        />
      ),
    }).default(selectedPermissionIds),
  });

  return <SmartFormDialog
    trigger={props.trigger}
    title={props.type === "creator" ? "Team Creator Default Permissions" : "Team Member Default Permissions"}
    formSchema={formSchema}
    okButton={{ label: "Create" }}
    onSubmit={async (values) => {
      if (props.type === "creator") {
        await project.update({
          config: {
            teamCreatorDefaultPermissions: values.permissions.map((id) => ({ id })),
          },
        });
      } else {
        await project.update({
          config: {
            teamMemberDefaultPermissions: values.permissions.map((id) => ({ id })),
          },
        });
      }
    }}
    cancelButton
  />;
}

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProject();

  return (
    <PageLayout title="Team Settings">
      <SettingCard title="Automatic Team Creation">
        <SettingSwitch
          label="Create a personal team for each user on sign-up"
          checked={project.config.createTeamOnSignUp}
          onCheckedChange={async (checked) => {
            await project.update({
              config: {
                createTeamOnSignUp: checked,
              },
            });
          }}
        />
        <Typography variant="secondary" type="footnote">
          When enabled, a personal team will be created for each user when they sign up. This will not automatically create teams for existing users.
        </Typography>
      </SettingCard>

      {([
        {
          type: 'creator',
          title: "Team Creator Default Permissions",
          description: "Permissions the user will automatically be granted when creating a team",
          key: 'teamCreatorDefaultPermissions',
        }, {
          type: 'member',
          title: "Team Member Default Permissions",
          description: "Permissions the user will automatically be granted when joining a team",
          key: 'teamMemberDefaultPermissions',
        }
      ] as const).map(({ type, title, description, key }) => (
        <SettingCard
          key={key}
          title={title}
          description={description}
          actions={<CreateDialog
            trigger={<Button variant="secondary">Edit</Button>}
            type={type}
          />}
        >
          <div className="flex flex-wrap gap-2">
            {project.config[key].length > 0 ?
              project.config[key].map((p) => (
                <Badge key={p.id} variant='secondary'>{p.id}</Badge>
              )) :
              <Typography variant="secondary" type="label">No default permissions set</Typography>
            }
          </div>
        </SettingCard>
      ))}
    </PageLayout>
  );
}
