'use client';

import React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AsyncButton } from "@/components/ui/button";
import { CircleAlert, Info, LucideIcon } from "lucide-react";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";

type DialogProps = {
  trigger: React.ReactNode,
  titleIcon?: LucideIcon,
  title: boolean | React.ReactNode,
  description?: React.ReactNode,
  retainContentsWhenClosed?: boolean,
  danger?: boolean,
  okButton?: boolean | Readonly<{
    label?: string,
    onClick?: () => Promise<"prevent-close" | undefined | void>,
    props?: Partial<React.ComponentProps<typeof AsyncButton>>,
  }>,
  cancelButton?: boolean | Readonly<{
    label?: string,
    onClick?: () => Promise<"prevent-close" | undefined | void>,
    props?: Partial<React.ComponentProps<typeof AsyncButton>>,
  }>,
  onClose?: () => void | Promise<void>,
  disableButtons?: boolean,
  children?: React.ReactNode,
};

export function ActionDialog(props: DialogProps) {
  const color = props.danger ? "danger" : "primary";
  const okButton = props.okButton === true ? {} : props.okButton;
  const cancelButton = props.cancelButton === true ? {} : props.cancelButton;
  const anyButton = !!(okButton || cancelButton);
  const title = props.title === true ? (props.cancelButton ? "Confirmation" : "Alert") : props.title;
  const TitleIcon = props.titleIcon || (props.danger ? CircleAlert : Info);
  const [open, setOpen] = React.useState(false);
  
  const onOpenChange = (open: boolean) => {
    if (!open && props.onClose) {
      runAsynchronously(props.onClose());
    }
    setOpen(open);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {props.trigger}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <TitleIcon className="h-4 w-4 mr-2"/>
            {title}
          </DialogTitle>
          <DialogDescription>
            {props.description}
          </DialogDescription>
        </DialogHeader>

        <div>
          {props.children}
        </div>

        {anyButton && <DialogFooter>
          {okButton && (
            <AsyncButton
              disabled={props.disableButtons}
              color={color}
              onClick={async () => {
                if (await okButton.onClick?.() !== "prevent-close") {
                  onOpenChange(false);
                }
              }}
              {...okButton.props}
            >
              {okButton.label ?? "OK"}
            </AsyncButton>
          )}
          {cancelButton && (
            <AsyncButton
              disabled={props.disableButtons}
              variant="secondary"
              color="neutral"
              onClick={async () => {
                if (await cancelButton.onClick?.() !== "prevent-close") {
                  onOpenChange(false);
                }
              }}
              {...cancelButton.props}
            >
            Cancel
            </AsyncButton>
          )}
        </DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
