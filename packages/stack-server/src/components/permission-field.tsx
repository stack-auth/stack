import { FieldLabel } from "@/components/form-fields";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ServerTeam, ServerUser } from "@stackframe/stack";
import { ServerPermissionDefinitionJson } from "@stackframe/stack-shared/dist/interface/serverInterface";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { useEffect, useState } from "react";
import { Control, FieldValues, Path } from "react-hook-form";

// used to represent the permission being edited, so we don't need to update the id all the time
const CURRENTLY_EDITED_PERMISSION_SENTINEL = `--stack-internal-currently-edited-permission-sentinel-${generateSecureRandomString()}`;

export class PermissionGraph {
  public readonly permissions: Map<string, ServerPermissionDefinitionJson>;

  constructor(permissions: Iterable<ServerPermissionDefinitionJson>) {
    this.permissions = this._copyPermissions(permissions);
  }

  copy(): PermissionGraph {
    return new PermissionGraph(this.permissions.values());
  }

  _copyPermissions(permissions: Iterable<ServerPermissionDefinitionJson>): Map<string, ServerPermissionDefinitionJson> {
    const result: Map<string, ServerPermissionDefinitionJson> = new Map();
    [...permissions].forEach(permission => {
      result.set(permission.id, {
        ...permission, 
        containPermissionIds: [...permission.containPermissionIds]
      });
    });
    return result;
  }

  updatePermission(
    permissionId: string,
    permission: ServerPermissionDefinitionJson
  ) {
    const permissions = this._copyPermissions(this.permissions.values());
    permissions.set(permissionId, permission);

    for (const [key, value] of permissions.entries()) {
      permissions.set(key, {
        ...value,
        containPermissionIds: value.containPermissionIds.map(id => id === permissionId ? permission.id : id)
      });
    }

    return new PermissionGraph(permissions.values());
  }

  addPermission(containPermissionIds?: string[]) {
    const permissions = this._copyPermissions(this.permissions.values());
    permissions.set(CURRENTLY_EDITED_PERMISSION_SENTINEL, {
      id: CURRENTLY_EDITED_PERMISSION_SENTINEL,
      description: 'none',
      scope: { type: 'any-team' },
      __databaseUniqueId: 'none',
      containPermissionIds: containPermissionIds || [],
    });
    return new PermissionGraph(permissions.values());
  }

  replacePermission(permissionId: string) {
    const permissions = this._copyPermissions(this.permissions.values());
    const oldPermission = permissions.get(permissionId) ?? throwErr(`Permission ${permissionId} not found in replacePermission`);
    permissions.delete(permissionId);
    permissions.set(CURRENTLY_EDITED_PERMISSION_SENTINEL, {
      ...oldPermission,
      id: CURRENTLY_EDITED_PERMISSION_SENTINEL,
    });
    for (const [key, value] of permissions.entries()) {
      permissions.set(key, {
        ...value,
        containPermissionIds: value.containPermissionIds.map(id => id === permissionId ? CURRENTLY_EDITED_PERMISSION_SENTINEL : id),
      });
    }

    return new PermissionGraph([...permissions.values()]);
  }

  recursiveContains(permissionId: string): ServerPermissionDefinitionJson[] {
    const permission = this.permissions.get(permissionId);
    if (!permission) throw new Error(`Permission with id ${permissionId} not found`);
    
    const result = new Map<string, ServerPermissionDefinitionJson>();
    const idsToProcess = [...permission.containPermissionIds];
    while (idsToProcess.length > 0) {
      const id = idsToProcess.pop();
      if (!id) throw new Error('Unexpected undefined id, this should not happen');
      if (result.has(id)) continue;
      const p = this.permissions.get(id);
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
    const permission = this.permissions.get(permissionId);
    if (!permission) throw new Error(`Permission with id ${permissionId} not found`);
    
    const ancestors = [];
    for (const [key, permission] of this.permissions.entries()) {
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

  if (!graph || graph.permissions.size <= 1) {
    return null;
  }

  const currentPermission = graph.permissions.get(CURRENTLY_EDITED_PERMISSION_SENTINEL);
  if (!currentPermission) throw new Error('Placeholder permission not found');
  
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Contained permissions</FormLabel>
          <div className="flex-col rounded-lg border p-3 shadow-sm max-h-64 overflow-y-auto">
            {[...graph.permissions.values()].map(permission => {
              if (permission.id === CURRENTLY_EDITED_PERMISSION_SENTINEL) return null;

              const selected = currentPermission.containPermissionIds.includes(permission.id);
              const contain = graph.hasPermission(CURRENTLY_EDITED_PERMISSION_SENTINEL, permission.id);
              const ancestors = graph.recursiveAncestors(permission.id).map(p => p.id).filter(
                id => id !== permission.id && id !== CURRENTLY_EDITED_PERMISSION_SENTINEL && currentPermission.containPermissionIds.includes(id)
              );
              const inheritedFrom = contain && ancestors.length > 0 && `(from ${ancestors.join(', ')})`;
              return (
                <label className="flex flex-row justify-start gap-2 -my-3 py-3" key={permission.id}>
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
                        setGraph(graph.updatePermission(CURRENTLY_EDITED_PERMISSION_SENTINEL, {
                          ...currentPermission,
                          containPermissionIds: newContains
                        }));
                      }}
                    />
                  </FormControl>
                  <FieldLabel>
                    {permission.id} 
                    {inheritedFrom && <span className="text-gray-500"> {inheritedFrom}</span>}
                  </FieldLabel>
                  <FormMessage />
                </label>
              );
            })}
          </div>
        </FormItem>
      )}
    />
  );
}
