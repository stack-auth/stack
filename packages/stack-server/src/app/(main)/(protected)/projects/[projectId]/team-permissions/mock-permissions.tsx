export type Permission = {
  id: string,
  name: string,
  description: string,
  contains?: string[],
  has: (permissionName: string) => boolean,
}

let mockPermissions = [
  {
    name: "admin",
    contains: ["member", "editor", "special-permission"],
  },
  {
    name: "member",
    contains: ["view:organization", "view:user"],
  },
  {
    name: "editor",
    contains: ["edit:organization", "edit:user"],
  },
  {
    name: "view:organization",
  },
  {
    name: "edit:organization",
  },
  {
    name: "view:user",
  },
  {
    name: "edit:user",
  },
  {
    name: "special-permission",
  }
].map((permission, index) => ({
  id: index.toString(),
  description: "description",
  ...permission,
}));


const has = (permission: Omit<Permission, "has">, permissionName: string) => {
  if (permission.name === permissionName) {
    return true;
  }

  const queue: (Omit<Permission, "has"> | null)[] = [permission];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    if (current.contains) {
      for (const pName of current.contains) {
        const permission = mockPermissions.find((p) => p.name === pName);
        if (permission) {
          if (permission.name === permissionName) {
            return true;
          }
          queue.push(permission);
        }
      }
    }
  }
  return false;
};

mockPermissions = mockPermissions.map((permission) => ({
  ...permission,
  has: (permissionName: string) => has(permission, permissionName),
}));

export { mockPermissions };