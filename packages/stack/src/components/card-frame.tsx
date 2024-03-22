'use client';

import { Card, Container } from "../components-core";
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
      <div id='stack-card-frame' style={{ 
        height: hasNoParent ? '100vh' : '100%',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Container size='xs'>
          <Card>
            {children}
          </Card>
        </Container>
      </div>
    );
  } else {
    return children;
  }
  
}
