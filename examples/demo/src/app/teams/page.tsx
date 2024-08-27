'use client';

import { SelectedTeamSwitcher, useUser } from "@stackframe/stack";

export default function Page() {
  const user = useUser({ or: 'redirect' });

  return (
    <div className='flex-col w-64'>
      <SelectedTeamSwitcher />
    </div>
  );
}
