"use client";

import { use, useState } from "react";
import { Paragraph } from "@/components/paragraph";
import { useStrictMemo } from "@stackframe/stack-shared/src/hooks/use-strict-memo";
import { UsersTable } from "./users-table";
import { useAdminApp } from "../../useAdminInterface";


export default function UsersDashboardClient() {
  const stackAdminApp = useAdminApp();
  const [invalidationCounter, setInvalidationCounter] = useState(0);

  const allUsersPromise = useStrictMemo(() => {
    return stackAdminApp.listUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidationCounter]);
  const allUsers = use(allUsersPromise);

  return (
    <>
      <Paragraph h1>
        Users
      </Paragraph>

      <Paragraph body>
        <UsersTable rows={allUsers} onInvalidate={() => setInvalidationCounter(() => invalidationCounter + 1)} />
      </Paragraph>
    </>
  );
}
