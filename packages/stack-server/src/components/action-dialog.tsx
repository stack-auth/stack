'use client';

import React, { useEffect } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { CircleAlert, Info, LucideIcon } from "lucide-react";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { Checkbox } from "./ui/checkbox";
import { Alert } from "./ui/alert";
import { Typography } from "@mui/joy";

export type ActionDialogProps = {
  trigger?: React.ReactNode,
  open?: boolean,
  onClose?: () => void | Promise<void>,
  onOpenChange?: (open: boolean) => void,
  titleIcon?: LucideIcon,
  title: boolean | React.ReactNode,
  description?: React.ReactNode,
  danger?: boolean,
  okButton?: boolean | Readonly<{
    label?: string,
    onClick?: () => Promise<"prevent-close" | undefined | void>,
    props?: Partial<React.ComponentProps<typeof Button>>,
  }>,
  cancelButton?: boolean | Readonly<{
    label?: string,
    onClick?: () => Promise<"prevent-close" | undefined | void>,
    props?: Partial<React.ComponentProps<typeof Button>>,
  }>,
  confirmText?: string,
  children?: React.ReactNode,
};

export function ActionDialog(props: ActionDialogProps) {
  const okButton = props.okButton === true ? {} : props.okButton;
  const cancelButton = props.cancelButton === true ? {} : props.cancelButton;
  const anyButton = !!(okButton || cancelButton);
  const title = props.title === true ? (props.cancelButton ? "Confirmation" : "Alert") : props.title;
  const TitleIcon = props.titleIcon || (props.danger ? CircleAlert : Info);
  const [openState, setOpenState] = React.useState(!!props.open);
  const open = props.open ?? openState;
  const [confirmed, setConfirmed] = React.useState(false);
  
  const onOpenChange = (open: boolean) => {
    if (!open && props.onClose) {
      setConfirmed(false);
      runAsynchronously(props.onClose());
    }
    setOpenState(open);
    props.onOpenChange?.(open);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {props.trigger && <DialogTrigger asChild>
        {props.trigger}
      </DialogTrigger>}

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center">
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
        
        {props.confirmText && <Alert className="flex gap-4 items-center">
          <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)}/>
          <Typography>{props.confirmText}</Typography>
        </Alert>}


        {anyButton && <DialogFooter>
          {cancelButton && (
            <Button
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
            </Button>
          )}
          {okButton && (
            <Button
              disabled={!!props.confirmText && !confirmed}
              variant={props.danger ? "destructive" : "default"}
              onClick={async () => {
                if (await okButton.onClick?.() !== "prevent-close") {
                  onOpenChange(false);
                }
              }}
              {...okButton.props}
            >
              {okButton.label ?? "OK"}
            </Button>
          )}
        </DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
