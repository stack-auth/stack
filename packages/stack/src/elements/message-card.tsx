'use client';

import React from "react";
import CardFrame from "./card-frame";
import { Text } from "@stackframe/stack-ui";

export default function MessageCard(
  { children, title, fullPage=false }: 
  { children?: React.ReactNode, title: string, fullPage?: boolean}
) {
  return (
    <CardFrame fullPage={fullPage}>
      <div style={{ textAlign: 'center' }}>
        <Text size="xl" as='h2' style={{ marginBottom: '24px' }}>{title}</Text>
        {children}
      </div>
    </CardFrame>
  );
}
