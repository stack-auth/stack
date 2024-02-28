"use client";

import { useSnackbar } from "@/hooks/use-snackbar";
import { Icon } from "./icon";
import { AsyncIconButton } from "./async-icon-button";

type PropsWithoutBase = {
  content: string,
};
type Props = PropsWithoutBase & Omit<React.ComponentProps<typeof AsyncIconButton>, keyof PropsWithoutBase>;

export function CopyButton(props: Props) {
  const snackbar = useSnackbar();

  return (
    <AsyncIconButton
      {...props}
      onClick={async (...args) => {
        await props.onClick?.(...args);
        try {
          await navigator.clipboard.writeText(props.content);
          snackbar.showSuccess('Copied to clipboard!');
        } catch (e) {
          snackbar.showError('Failed to copy to clipboard!');
        }
      }}
    >
      <Icon icon="content_copy" />
    </AsyncIconButton>
  );
}
