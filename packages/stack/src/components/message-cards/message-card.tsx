'use client';

import React from "react";
import { MaybeFullPage } from "../elements/maybe-full-page";
import { Button, Typography } from "@stackframe/stack-ui";

export function MessageCard(
  { fullPage=false, ...props }:
  {
    children?: React.ReactNode,
    title: string,
    fullPage?: boolean,
    primaryButtonText?: string,
    primaryAction?: () => Promise<void> | void,
    secondaryButtonText?: string,
    secondaryAction?: () => Promise<void> | void,
  }
) {
  return (
    <MaybeFullPage fullPage={fullPage}>
      <div style={{ textAlign: 'center' }}>
        <Typography type='h3' className="mb-6">{props.title}</Typography>
        {props.children}
        {(props.primaryButtonText || props.secondaryButtonText) && (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: 20 }}>
            {props.secondaryButtonText && (
              <Button variant="secondary" onClick={props.secondaryAction}>
                {props.secondaryButtonText}
              </Button>
            )}
            {props.primaryButtonText && (
              <Button onClick={props.primaryAction}>
                {props.primaryButtonText}
              </Button>
            )}
          </div>
        )}
      </div>
    </MaybeFullPage>
  );
}
