import React from "react";
import { TEditorConfiguration } from "@stackframe/stack-emails/dist/editor/documents/editor/core";
import { Container as BaseContainer } from "../../../blocks/block-container";
import { ReaderBlock } from "../../reader/core";
import { ContainerProps } from "./container-props-schema";

export default function ContainerReader({ style, props, document }: ContainerProps & { document?: TEditorConfiguration }) {
  const childrenIds = props?.childrenIds ?? [];
  return (
    <BaseContainer style={style}>
      {childrenIds.map((childId) => (
        <ReaderBlock key={childId} id={childId} document={document} />
      ))}
    </BaseContainer>
  );
}
