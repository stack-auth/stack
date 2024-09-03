import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@stackframe/stack-ui";
import { toggleInspectorDrawerOpen, useInspectorDrawerOpen } from "../documents/editor/editor-context";

export default function ToggleInspectorPanelButton() {
  const inspectorDrawerOpen = useInspectorDrawerOpen();

  const handleClick = () => {
    toggleInspectorDrawerOpen();
  };
  if (inspectorDrawerOpen) {
    return (
      <Button onClick={handleClick} size="icon" variant="ghost">
        <PanelRightClose className="h-5 w-5" />
      </Button>
    );
  }
  return (
    <Button onClick={handleClick} size="icon" variant="ghost">
      <PanelRightOpen className="h-5 w-5" />
    </Button>
  );
}
