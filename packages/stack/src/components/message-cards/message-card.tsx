"use client";

import React from "react";
import { Button, Typography } from "@stackframe/stack-ui";
import { MaybeFullPage } from "../elements/maybe-full-page";

export function MessageCard({
  fullPage = false,
  ...props
}: {
  children?: React.ReactNode;
  title: string;
  fullPage?: boolean;
  primaryButtonText?: string;
  primaryAction?: () => Promise<void> | void;
  secondaryButtonText?: string;
  secondaryAction?: () => Promise<void> | void;
}) {
  return (
    <MaybeFullPage fullPage={fullPage}>
      <div className="stack-scope flex flex-col gap-4 text-center" style={{ width: "380px", padding: fullPage ? "1rem" : 0 }}>
        <Typography type="h3">{props.title}</Typography>
        {props.children}
        {(props.primaryButtonText || props.secondaryButtonText) && (
          <div className="my-5 flex justify-center gap-4">
            {props.secondaryButtonText && (
              <Button variant="secondary" onClick={props.secondaryAction}>
                {props.secondaryButtonText}
              </Button>
            )}
            {props.primaryButtonText && <Button onClick={props.primaryAction}>{props.primaryButtonText}</Button>}
          </div>
        )}
      </div>
    </MaybeFullPage>
  );
}
