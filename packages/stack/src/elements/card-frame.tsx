'use client';

import { useElements } from "@stackframe/stack-ui";
import React from "react";

export default function CardFrame({ 
  children, 
  fullPage=true 
}: { 
  children: React.ReactNode, 
  fullPage?: boolean, 
}) {
  const { Container } = useElements();
  
  if (fullPage) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container size={360}>
          {children}
        </Container>
      </div>
    );
  } else {
    return children;
  }
  
}
