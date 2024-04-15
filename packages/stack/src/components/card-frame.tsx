'use client';

import { Container } from "../components-core";
import React, { useEffect, useState } from "react";

export default function CardFrame({ 
  children, 
  fullPage=true
}: { 
  children: React.ReactNode, 
  fullPage?: boolean, 
}) {
  const [hasNoParent, setHasNoParent] = useState(false);
  useEffect(() => {
    const component = document.getElementById('stack-card-frame');
    setHasNoParent(
      !component?.parentElement || 
      component?.parentElement === document.body || 
      component?.parentElement === document.documentElement
    );
  }, []);

  if (fullPage) {
    return (
      <div 
        id='stack-card-frame' 
        style={{ 
          height: hasNoParent ? '100vh' : '100%',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
        }}
      >
        <Container size={380} style={{ padding: '1rem 1rem' }}>
          {children}
        </Container>
      </div>
    );
  } else {
    return children;
  }
  
}
