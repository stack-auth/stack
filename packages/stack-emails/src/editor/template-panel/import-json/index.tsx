import { Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@stackframe/stack-ui";
import ImportJsonDialog from "./import-json-dialog";

export default function ImportJson() {
  const [open, setOpen] = useState(false);

  let dialog = null;
  if (open) {
    dialog = <ImportJsonDialog onClose={() => setOpen(false)} />;
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="secondary" className="gap-2">
        <Upload className="h-4 w-4" />
        Import JSON
      </Button>
      {dialog}
    </>
  );
}
