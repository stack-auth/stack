import { Modal, ModalDialog, DialogTitle, Separator, DialogContent, DialogActions } from "@mui/joy";
import React from "react";
import { AsyncButton } from "./async-button";
import { Icon } from "./icon";

type DialogProps = {
  open: boolean,
  onClose: () => void,
  titleIcon?: React.ComponentProps<typeof Icon>["icon"],
  title: boolean | React.ReactNode,
  retainContentsWhenClosed?: boolean,
  danger?: boolean,
  noAlert?: boolean,
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
  disableButtons?: boolean,
  children?: React.ReactNode,
};

export function Dialog(props: DialogProps) {
  const color = props.danger ? "danger" : "primary";
  const okButton = props.okButton === true ? {} : props.okButton;
  const cancelButton = props.cancelButton === true ? {} : props.cancelButton;
  const anyButton = !!(okButton || cancelButton);
  const title = props.title === true ? (props.cancelButton ? "Confirmation" : "Alert") : props.title;
  const titleIcon = props.titleIcon || (props.danger ? "warning" : "info");

  return (
    <Modal open={props.open} onClose={() => props.onClose()}>
      <ModalDialog role={props.noAlert ? undefined : "alertdialog"}>
        {(title || titleIcon) && (
          <DialogTitle>
            <Icon icon={titleIcon} />
            {title}
          </DialogTitle>
        )}
        {title && (
          <Separator />
        )}
        <DialogContent>
          {props.children}
        </DialogContent>
        {anyButton && (
          <DialogActions>
            {okButton && (
              <AsyncButton
                disabled={props.disableButtons}
                variant="solid"
                color={color}
                onClick={async () => {
                  if (await okButton.onClick?.() !== "prevent-close") {
                    props.onClose();
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
                variant="plain"
                color="neutral"
                onClick={async () => {
                  if (await cancelButton.onClick?.() !== "prevent-close") {
                    props.onClose();
                  }
                }}
                {...cancelButton.props}
              >
                Cancel
              </AsyncButton>
            )}
          </DialogActions>
        )}
      </ModalDialog>
    </Modal>
  );
}
