'use client';

import { Container } from "@stackframe/stack-ui";
import React from "react";

export default function CardFrame({ 
  children, 
  fullPage=true 
}: { 
  children: React.ReactNode, 
  fullPage?: boolean, 
}) {
  
  if (fullPage) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container size={360}>
          {children}
        </Container>
      </div>
    );
  } else {
    return children;
  }
  
}
