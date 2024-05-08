---
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Teams & Permissions

Teams are a way to group users together and manage their permissions. Each user can be a member of multiple teams, and each team can have multiple users. Teams can be used to manage, departments, B2B customers, or projects.

## Teams

### Creating a Team

To create a team, you can call the `createTeam` method on the `stackServerApp`, this is an example:

```tsx
const team = await stackServerApp.createTeam({
  displayName: 'New Team',
});
```

### Adding a User to a Team

To add a user to a team, you can call the `addUserToTeam` method on the `stackServerApp`, this is an example:

```tsx
await stackServerApp.addUserToTeam({
  teamId: team.id,
  userId: user.id,
});
```

### List All the Teams of a User

On the User object, you can call the `listTeams` method or `useTeams` hook to get all the teams a user is a member of. this is an example:

<Tabs>
  <TabItem value="client" label="Client Component" default>
    ```tsx
    "use client";
    import { useUser } from "@stackframe/stack";

    export function DisplayUserTeams() {
      const user = useUser({ or: 'redirect' });
      const teams = user.useTeams();

      return <div>
        {teams.map(team => <div key={team.id}>{team.displayName}</div>)}
      </div>;
    }
    ```
  </TabItem>

  <TabItem value="server" label="Server Component">
    ```tsx
    import { stackApp } from "@/lib/stack";

    export default async function DisplayUserTeams() {
      const user = await stackApp.getUser({ or: 'redirect' });
      const teams = await user.listTeams();

      return <div>
        {teams.map(team => <div key={team.id}>{team.displayName}</div>)}
      </div>;
    }
    ```
  </TabItem>
</Tabs>


### Get Specific Team of a User

On the User object, you can call the `getTeam` method or `useTeam` hook to get a specific team a user is a member of. Note that this might return `null` if the user is not a member of the team. This is basically the same as `listTeams()[teamId]`. Here is an example:

<Tabs>
  <TabItem value="client" label="Client Component" default>
    ```tsx
    "use client";
    import { useUser } from "@stackframe/stack";

    export function DisplayUserTeam(props: { teamId: string }) {
      const user = useUser({ or: 'redirect' });
      const team = user.useTeam(props.teamId);

      return <div>
        {team ? team.displayName : 'Not a member of this team'}
      </div>;
    }
    ```
  </TabItem>

  <TabItem value="server" label="Server Component">
    ```tsx
    import { stackApp } from "@/lib/stack";

    export default async function DisplayUserTeam(props: { teamId: string }) {
      const user = await stackApp.getUser({ or: 'redirect' });
      const team = await user.getTeam(props.teamId);

      return <div>
        {team ? team.displayName : 'Not a member of this team'}
      </div>;
    }
    ```
  </TabItem>
</Tabs>

### List All the Teams

To list all the teams, you can call the `listTeams` method on the `stackServerApp`, this is an example:

```tsx
const teams = await stackServerApp.listTeams();
```

### Update a Team

To update a team, you can call the update method on a server side team object, this is an example:

```tsx
const team = await stackServerApp.getTeam('teamId');
await team.update({
  displayName: 'New Team Name',
});
```

### Remove a User from a Team

To remove a user from a team, you can call the `removeUserFromTeam` method on the `stackServerApp`, this is an example:

```tsx
await stackServerApp.removeUserFromTeam({
  teamId: team.id,
  userId: user.id,
});
```

### List All the Members of a Team

To list all the members of a team, you can call the `listMembers` method on a server side team object. Note that the returned result is a list of `TeamMember` objects, from which you can also get the user object. This is an example:

```tsx
const team = await stackServerApp.getTeam('teamId');
const members = await team.listMembers();
for (const member of members) {
  const user = await member.getUser();
  console.log(user.displayName, 'is a member of', team.displayName);
}
```

## Permissions

Permissions are a way to control what each user can do in your application. You can create permissions on the Stack dashboard and assign them to users. Then you can check in your app if a user has a specific permission.

A permission can contain other permissions. For example, you can have `admin` permission that contains `moderator` and `user` permissions. You can create arbitrary permission structure (any directed graph) and we help you check if a user has a permission directly or indirectly (recursively).


## Check if a User has a Permission

You can use the `getPermission` method or `usePermission` hook on the `User` object to check if a user has a specific permission. This will return the Permission object if the user has the permission, otherwise it will return `null`. Note if the permission is not created on the dashboard, it will also return `null`

These functions will check all the direct and indirect permissions of the user. So with the above example, if a user has the `admin` permission, it will also return `true` for `moderator` and `user` permissions.

Be careful with client-side permission checks, as they can be easily bypassed by the user. The client-side permission checks are only for UI purposes, and you should always check the permissions on the server side for business logic.

Here is an example:

<Tabs>
  <TabItem value="client" label="Client Component" default>
    ```tsx
    "use client";
    import { useUser } from "@stackframe/stack";

    export function CheckUserPermission() {
      const user = useUser({ or: 'redirect' });
      const permission = user.usePermission('read');

      // Don't rely on client side permission checks for business logic
      return <div>
        {permission ? 'You have the read permission' : 'You shall not pass'}
      </div>;
    }
    ```
  </TabItem>

  <TabItem value="server" label="Server Component">
    ```tsx
    import { stackApp } from "@/lib/stack";

    export default async function CheckUserPermission() {
      const user = await stackApp.getUser({ or: 'redirect' });
      const permission = await user.getPermission('read');

      // This is a server side check, so it's secure
      return <div>
        {permission ? 'You have the read permission' : 'You shall not pass'}
      </div>;
    }
    ```
  </TabItem>
</Tabs>


### List All the Permissions of a User

You can use the `listPermissions` method or `usePermissions` hook on the `User` object to get all the permissions a user has. This will return a list of Permission objects. 

This method will return all the permissions the user has directly or indirectly. This is an example:

<Tabs>
  <TabItem value="client" label="Client Component" default>
    ```tsx
    "use client";
    import { useUser } from "@stackframe/stack";

    export function DisplayUserPermissions() {
      const user = useUser({ or: 'redirect' });
      const permissions = user.usePermissions();

      return <div>
        {permissions.map(permission => <div key={permission.id}>{permission.id}</div>)}
      </div>;
    }
    ```
  </TabItem>

  <TabItem value="server" label="Server Component">
    ```tsx
    import { stackApp } from "@/lib/stack";

    export default async function DisplayUserPermissions() {
      const user = await stackApp.getUser({ or: 'redirect' });
      const permissions = await user.listPermissions();

      return <div>
        {permissions.map(permission => <div key={permission.id}>{permission.id}</div>)}
      </div>;
    }
    ```
  </TabItem>
</Tabs>

### Grant a Permission to a User

To grant a permission to a user, you can call the `grantPermission` method on the `ServerUser`, this is an example:

```tsx
const team = await stackServerApp.getTeam('teamId');
const user = await stackServerApp.getUser();
await user.grantPermission(team, 'read');
```

### Revoke a Permission from a User

To revoke a permission from a user, you can call the `revokePermission` method on the `ServerUser`, this is an example:

```tsx
const team = await stackServerApp.getTeam('teamId');
const user = await stackServerApp.getUser();
await user.revokePermission(team, 'read');
```