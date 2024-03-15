import React, { createContext, useContext } from 'react';
import Button, { ButtonProps } from '../elements/button';

type Elements = {
  Button: React.ElementType<ButtonProps>,

}

type ProviderProps = {
  children: React.ReactNode,
  elements?: Partial<Elements>,
}

const ElementContext = createContext<Elements | undefined>(undefined);

export function useElement() {
  const context = useContext(ElementContext);
  if (!context) {
    throw new Error('useElement must be used within a ElementProvider');
  }
  return context;
}

export function StackElementProvider(props: ProviderProps) {
  return (
    <ElementContext.Provider value={{
      Button: props.elements?.Button || Button,
    }}>
      {props.children}
    </ElementContext.Provider>
  );
}