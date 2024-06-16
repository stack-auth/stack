'use client';

import React from "react";
import MaybeFullPage from "../maybe-full-page";
import { Button, Text } from "../../components-core";

export default function MessageCard(
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
        <Text size="xl" as='h2' style={{ marginBottom: '24px' }}>{props.title}</Text>
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
