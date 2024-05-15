import { FieldLabel } from "@/components/form-fields";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ServerTeam, ServerUser } from "@stackframe/stack";
import { ServerPermissionDefinitionJson } from "@stackframe/stack-shared/dist/interface/serverInterface";
import { useEffect, useState } from "react";
import { Control, FieldValues, Path } from "react-hook-form";

// used to represent the permission being edited, so we don't need to update the id all the time
const PLACEHOLDER_ID = 'f2j1290ajf9812elk';

export class PermissionGraph {
  permissions: Record<string, ServerPermissionDefinitionJson>;

  constructor(permissions: ServerPermissionDefinitionJson[]) {
    this.permissions = this._copyPermissions(permissions);
  }

  copy(): PermissionGraph {
    return new PermissionGraph(Object.values(this.permissions));
  }

  _copyPermissions(permissions: ServerPermissionDefinitionJson[]): Record<string, ServerPermissionDefinitionJson> {
    const result: Record<string, ServerPermissionDefinitionJson> = {};
    permissions.forEach(permission => {
      result[permission.id] = {
        ...permission, 
        containPermissionIds: [...permission.containPermissionIds]
      };
    });
    return result;
  }

  updatePermission(
    permissionId: string,
    permission: ServerPermissionDefinitionJson
  ) {
    const permissions = this._copyPermissions(Object.values(this.permissions));
    permissions[permissionId] = permission;

    for (const [key, value] of Object.entries(permissions)) {
      permissions[key] = {
        ...value,
        containPermissionIds: value.containPermissionIds.map(id => id === permissionId ? permission.id : id)
      };
    }

    return new PermissionGraph(Object.values(permissions));
  }

  addPermission(containPermissionIds?: string[]) {
    const permissions = this._copyPermissions(Object.values(this.permissions));
    permissions[PLACEHOLDER_ID] = {
      id: PLACEHOLDER_ID,
      description: 'none',
      scope: { type: 'any-team' },
      __databaseUniqueId: 'none',
      containPermissionIds: containPermissionIds || [],
    };
    return new PermissionGraph(Object.values(permissions));
  }

  replacePermission(permissionId: string) {
    const permissions = this._copyPermissions(Object.values(this.permissions));
    const oldPermission = permissions[permissionId];
    delete permissions[permissionId];
    permissions[PLACEHOLDER_ID] = {
      ...oldPermission,
      id: PLACEHOLDER_ID,
    };
    for (const [key, value] of Object.entries(permissions)) {
      permissions[key] = {
        ...value,
        containPermissionIds: value.containPermissionIds?.map(id => id === permissionId ? PLACEHOLDER_ID : id) || [],
      };
    }

    return new PermissionGraph(Object.values(permissions));
  }

  recursiveContains(permissionId: string): ServerPermissionDefinitionJson[] {
    const permission = this.permissions[permissionId];
    if (!permission) throw new Error(`Permission with id ${permissionId} not found`);
    
    const result = new Map<string, ServerPermissionDefinitionJson>();
    const idsToProcess = [...permission.containPermissionIds];
    while (idsToProcess.length > 0) {
      const id = idsToProcess.pop();
      if (!id) throw new Error('Unexpected undefined id, this should not happen');
      if (result.has(id)) continue;
      const p = this.permissions[id];
      if (!p) throw new Error(`Permission with id ${id} not found`);
      result.set(id, p);
      idsToProcess.push(...p.containPermissionIds);
    }

    return [...result.values()];
  }

  hasPermission(permissionId: string, targetPermissionId: string): boolean {
    return this.recursiveContains(permissionId).some(permission => permission.id === targetPermissionId);
  }

  recursiveAncestors(permissionId: string): ServerPermissionDefinitionJson[] {
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

export function PermissionListField<F extends FieldValues>(props: {
  control: Control<F>,
  name: Path<F>,
  permissions: ServerPermissionDefinitionJson[],
  type: 'new' | 'edit' | 'edit-user',
} & ({
    type: 'new',
  } | {
    type: 'edit',
    selectedPermissionId: string,
  } | {
    type: 'edit-user',
    user: ServerUser,
    team: ServerTeam,
  })) {
  const [graph, setGraph] = useState<PermissionGraph>();

  useEffect(() => {
    async function load() {
      const newGraph = new PermissionGraph(props.permissions);

      switch (props.type) {
        case 'edit-user': {
          setGraph((new PermissionGraph(props.permissions)).addPermission(
            (await props.user.listPermissions(props.team, { direct: true })).map(permission => permission.id)
          ));
          break;
        }
        case 'edit': {
          setGraph(newGraph.replacePermission(props.selectedPermissionId));
          break;
        }
        case 'new': {
          setGraph(newGraph.addPermission());
          break;
        }
      }
    }
    load().catch(console.error);
  // @ts-ignore
  }, [props.permissions, props.selectedPermissionId, props.type, props.user, props.team]);

  if (!graph) return null;

  const currentPermission = graph.permissions[PLACEHOLDER_ID];
  
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Contained Permissions</FormLabel>
          <div className="flex-col rounded-lg border p-3 shadow-sm space-y-4 max-h-64 overflow-y-auto">
            {Object.values(graph.permissions).map(permission => {
              if (permission.id === PLACEHOLDER_ID) return null;

              const selected = currentPermission.containPermissionIds.includes(permission.id);
              const contain = graph.hasPermission(PLACEHOLDER_ID, permission.id);
              const ancestors = graph.recursiveAncestors(permission.id).map(p => p.id).filter(
                id => id !== permission.id && id !== PLACEHOLDER_ID && currentPermission.containPermissionIds.includes(id)
              );
              const inheritedFrom = contain && ancestors.length > 0 && `(from ${ancestors.join(', ')})`;
              return (
                <div className="flex flex-row items-center justify-between" key={permission.id}>
                  <FieldLabel>
                    {permission.id} 
                    {inheritedFrom && <span className="text-gray-500"> {inheritedFrom}</span>}
                  </FieldLabel>
                  <FormControl>
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) => {
                        let newContains: string[];
                        if (checked) {
                          newContains = [...field.value, permission.id];
                        } else {
                          newContains = field.value.filter((v: any) => v !== permission.id);
                        }
                        newContains = [...new Set(newContains)];

                        field.onChange(newContains);
                        setGraph(graph.updatePermission(PLACEHOLDER_ID, {
                          ...currentPermission,
                          containPermissionIds: newContains
                        }));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              );
            })}
          </div>
        </FormItem>
      )}
    />
  );
}