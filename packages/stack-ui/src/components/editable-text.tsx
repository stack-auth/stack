'use client';

import { useState } from "react";
import { Button, Input, Typography } from "..";
import { Edit } from "lucide-react";

export function EditableText(props: { value: string, onSave?: (value: string) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(props.value);

  return (
    <div className='flex items-center gap-2'>
      {editing ? (
        <>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button onClick={async () => {
            await props.onSave?.(value);
            setEditing(false);
          }}>
            Save
          </Button>
          <Button
            variant='outline'
            onClick={() => {
              setValue(props.value);
              setEditing(false);
            }}>
            Cancel
          </Button>
        </>
      ) : (
        <>
          <Typography>{value}</Typography>
          <Button onClick={() => setEditing(true)} size='icon' variant='ghost'>
            <Edit className="w-4 h-4"/>
          </Button>
        </>
      )}
    </div>
  );
}