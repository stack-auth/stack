import React from 'react';
import { z } from 'zod';
import { Button, ButtonPropsSchema } from '../../blocks/block-button';
import { Divider, DividerPropsSchema } from '../../blocks/block-divider';
import { Heading, HeadingPropsSchema } from '../../blocks/block-heading';
import { Image, ImagePropsSchema } from '../../blocks/block-image';
import { Spacer, SpacerPropsSchema } from '../../blocks/block-spacer';
import { Text, TextPropsSchema } from '../../blocks/block-text';
import {
  buildBlockComponent,
  buildBlockConfigurationDictionary,
  buildBlockConfigurationSchema,
} from '../../document-core';
import ColumnsContainerEditor from '../blocks/columns-container/columns-container-editor';
import ColumnsContainerPropsSchema from '../blocks/columns-container/columns-container-props-schema';
import ContainerEditor from '../blocks/container/container-editor';
import ContainerPropsSchema from '../blocks/container/container-props-schema';
import EmailLayoutEditor from '../blocks/email-layout/email-layout-editor';
import EmailLayoutPropsSchema from '../blocks/email-layout/email-layout-props-schema';
import EditorBlockWrapper from '../blocks/helpers/block-wrappers/editor-block-wrapper';

const EDITOR_DICTIONARY = buildBlockConfigurationDictionary({
  Button: {
    schema: ButtonPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <Button {...props} />
      </EditorBlockWrapper>
    ),
  },
  Container: {
    schema: ContainerPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <ContainerEditor {...props} />
      </EditorBlockWrapper>
    ),
  },
  ColumnsContainer: {
    schema: ColumnsContainerPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <ColumnsContainerEditor {...props} />
      </EditorBlockWrapper>
    ),
  },
  Heading: {
    schema: HeadingPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <Heading {...props} />
      </EditorBlockWrapper>
    ),
  },
  Image: {
    schema: ImagePropsSchema,
    Component: (props) => {
      return (
        <EditorBlockWrapper>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image {...props} />
        </EditorBlockWrapper>
      );
    },
  },
  Text: {
    schema: TextPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <Text {...props} />
      </EditorBlockWrapper>
    ),
  },
  EmailLayout: {
    schema: EmailLayoutPropsSchema,
    Component: (p) => <EmailLayoutEditor {...p} />,
  },
  Spacer: {
    schema: SpacerPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <Spacer {...props} />
      </EditorBlockWrapper>
    ),
  },
  Divider: {
    schema: DividerPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <Divider {...props} />
      </EditorBlockWrapper>
    ),
  },
});

export const EditorBlock = buildBlockComponent(EDITOR_DICTIONARY);
export const EditorBlockSchema = buildBlockConfigurationSchema(EDITOR_DICTIONARY);
export const EditorConfigurationSchema = z.record(z.string(), EditorBlockSchema);

export type TEditorBlock = z.infer<typeof EditorBlockSchema>;
export type TEditorConfiguration = Record<string, TEditorBlock>;
