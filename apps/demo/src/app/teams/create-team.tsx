"use client";

import { Input, Button } from "@stackframe/stack";
import React from "react";
import { createTeam } from "./server-actions";

export function CreateTeam() {
  const [displayName, setDisplayName] = React.useState('');
  
  return (
    <div className='flex gap-2 my-6'>
      <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder='Team Name' />
      <Button 
        onClick={async () => {
          await createTeam({ displayName }); 
          window.location.reload();
        }} 
        disabled={!displayName}
      >
      Create Team
      </Button>
    </div>
  );
}
