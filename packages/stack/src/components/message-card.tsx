'use client';

import React from "react";
import MaybeFullPage from "./maybe-full-page";
import { Text } from "../components-core";

export default function MessageCard(
  { children, title, fullPage=false }: 
  { children?: React.ReactNode, title: string, fullPage?: boolean}
) {
  return (
    <MaybeFullPage fullPage={fullPage}>
      <div style={{ textAlign: 'center' }}>
        <Text size="xl" as='h2' style={{ marginBottom: '24px' }}>{title}</Text>
        {children}
      </div>
    </MaybeFullPage>
  );
}
