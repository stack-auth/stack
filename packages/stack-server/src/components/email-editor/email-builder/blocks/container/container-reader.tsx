import React from 'react';

import { Container as BaseContainer } from '@usewaypoint/block-container';

import { ReaderBlock } from '../../reader/core';

import { ContainerProps } from './container-props-schema';

export default function ContainerReader({ style, props }: ContainerProps) {
  const childrenIds = props?.childrenIds ?? [];
  return (
    <BaseContainer style={style}>
      {childrenIds.map((childId) => (
        <ReaderBlock key={childId} id={childId} />
      ))}
    </BaseContainer>
  );
}
