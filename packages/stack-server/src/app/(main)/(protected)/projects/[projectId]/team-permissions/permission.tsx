import { Paragraph } from "@/components/paragraph";
import { deletePermission } from "@/lib/permissions";
import { Box, Checkbox, Divider, List, Stack } from "@mui/joy";
import { useEffect, useMemo, useState } from "react";
import { useAdminApp } from "../use-admin-app";
import { ServerPermissionJson } from "@stackframe/stack-shared/dist/interface/serverInterface";

export class PermissionGraph {
  permissions: Record<string, ServerPermissionJson>;

  constructor(permissions: ServerPermissionJson[]) {
    this.permissions = this._copyPermissions(permissions);
  }

  copy(): PermissionGraph {
    return new PermissionGraph(Object.values(this.permissions));
  }

  _copyPermissions(permissions: ServerPermissionJson[]): Record<string, ServerPermissionJson> {
    const result: Record<string, ServerPermissionJson> = {};
    permissions.forEach(permission => {
      result[permission.id] = {
        ...permission, 
        inheritFromPermissionIds: [...permission.inheritFromPermissionIds]
      };
    });
    return result;
  }

  updatePermission(permission: ServerPermissionJson) {
    const permissions = this._copyPermissions(Object.values(this.permissions));
    permissions[permission.id] = permission;
    return new PermissionGraph(Object.values(permissions));
  }

  recursiveContains(permissionId: string): ServerPermissionJson[] {
    const permission = this.permissions[permissionId];
    if (!permission) throw new Error(`Permission with id ${permissionId} not found`);
    return [permission].concat(
      permission.inheritFromPermissionIds.flatMap(id => this.recursiveContains(id))
    );
  }

  hasPermission(permissionId: string, targetPermissionId: string): boolean {
    return this.recursiveContains(permissionId).some(permission => permission.id === targetPermissionId);
  }

  recursiveAccestors(permissionId: string): ServerPermissionJson[] {
    const permission = this.permissions[permissionId];
    if (!permission) throw new Error(`Permission with id ${permissionId} not found`);
    
    const ancestors = [];
    for (const [key, permission] of Object.entries(this.permissions)) {
      if (this.hasPermission(permission.id, permissionId)) {
        ancestors.push(permission);
      }
    }

    return ancestors;
  }
}

export function PermissionList(props : { 
  targetPermissionId?: string, 
  onChange: (inheritFromPermissionIds: string[]) => void, 
}) {
  const stackAdminApp = useAdminApp();
  const permissions = stackAdminApp.usePermissions();
  const [graph, setGraph] = useState<PermissionGraph>();
  const targetId = props.targetPermissionId || "new-permission";

  useEffect(() => {
    setGraph(new PermissionGraph(permissions.map(p => p.toJson()).concat(props.targetPermissionId ? {
      id: "new-permission",
      description: "Root permission",
      inheritFromPermissionIds: [],
      scope: { type: "any-team" },
      __databaseUniqueId: 'placeholder',
    } : [])));
  }, [permissions, props.targetPermissionId]);

  if (!graph) return null;
  const currentPermission = graph.permissions[targetId];
  
  return (
    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
      {Object.values(graph.permissions).map((permission) => {
        if (permission.id === targetId) return null;

        const contain = graph.hasPermission(targetId, permission.id);

        return (
          <Box key={permission.id}>
            <Stack spacing={1} direction={"row"} alignItems={"center"}>
              <Checkbox
                checked={contain}
                // variant={inherited ? "solid" : "outlined"}
                // color={'primary'}
                onChange={(event) => {
                  const checked = event.target.checked;
                  const oldInherited = currentPermission.inheritFromPermissionIds.filter(id => id !== permission.id);
                  const newGraph = graph.updatePermission({
                    ...currentPermission,
                    inheritFromPermissionIds: checked ? [...oldInherited, permission.id] : oldInherited
                  });

                  setGraph(newGraph);
                  props.onChange(newGraph.permissions[targetId].inheritFromPermissionIds);
                }}
              />
              <Paragraph body>
                {permission.id}
                {/* {inherited && <span> (inherited from {inheritedFrom.join(', ')})</span>} */}
              </Paragraph>
            </Stack>
            <Divider sx={{ margin: 1 }} />
          </Box>
        );
      })}
    </List>
  );
}