import React from "react";
import { Button } from "@stackframe/stack-ui";

type BlockMenuButtonProps = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
};

export default function BlockTypeButton({ label, icon, onClick }: BlockMenuButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={(ev) => {
        ev.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-2"
    >
      {icon}
      <div className="flex flex-grow justify-center">{label}</div>
    </Button>
  );
}
