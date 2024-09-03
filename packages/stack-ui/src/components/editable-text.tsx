"use client";

import { Edit } from "lucide-react";
import { useState } from "react";
import { Button, Input, Typography } from "..";

export function EditableText(props: { value: string; onSave?: (value: string) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [editingValue, setEditingValue] = useState(props.value);

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <>
          <Input value={editingValue} onChange={(e) => setEditingValue(e.target.value)} />
          <Button
            onClick={async () => {
              await props.onSave?.(editingValue);
              setEditing(false);
            }}
          >
            Save
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setEditingValue(props.value);
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </>
      ) : (
        <>
          <Typography>{props.value}</Typography>
          <Button onClick={() => setEditing(true)} size="icon" variant="ghost">
            <Edit className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
