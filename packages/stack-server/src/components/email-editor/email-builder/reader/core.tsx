import React, { createContext, useContext } from 'react';
import { z } from 'zod';
import { Button, ButtonPropsSchema } from '../../block-button';
import { Divider, DividerPropsSchema } from '../../block-divider';
import { Heading, HeadingPropsSchema } from '../../block-heading';
import { Image, ImagePropsSchema } from '../../block-image';
import { Spacer, SpacerPropsSchema } from '../../block-spacer';
import { Text, TextPropsSchema } from '../../block-text';
import {
  buildBlockComponent,
  buildBlockConfigurationDictionary,
  buildBlockConfigurationSchema,
} from '../../document-core';
import ColumnsContainerPropsSchema from '../blocks/columns-container/columns-container-props-schema';
import ColumnsContainerReader from '../blocks/columns-container/columns-container-reader';
import { ContainerPropsSchema } from '../blocks/container/container-props-schema';
import ContainerReader from '../blocks/container/container-reader';
import { EmailLayoutPropsSchema } from '../blocks/email-layout/email-layout-props-schema';
import EmailLayoutReader from '../blocks/email-layout/email-layout-reader';

const ReaderContext = createContext<TReaderDocument>({});

function useReaderDocument() {
  return useContext(ReaderContext);
}

const READER_DICTIONARY = buildBlockConfigurationDictionary({
  ColumnsContainer: {
    schema: ColumnsContainerPropsSchema,
    Component: ColumnsContainerReader,
  },
  Container: {
    schema: ContainerPropsSchema,
    Component: ContainerReader,
  },
  EmailLayout: {
    schema: EmailLayoutPropsSchema,
    Component: EmailLayoutReader,
  },
  Button: {
    schema: ButtonPropsSchema,
    Component: Button,
  },
  Divider: {
    schema: DividerPropsSchema,
    Component: Divider,
  },
  Heading: {
    schema: HeadingPropsSchema,
    Component: Heading,
  },
  Image: {
    schema: ImagePropsSchema,
    Component: Image,
  },
  Spacer: {
    schema: SpacerPropsSchema,
    Component: Spacer,
  },
  Text: {
    schema: TextPropsSchema,
    Component: Text,
  },
});

export const ReaderBlockSchema = buildBlockConfigurationSchema(READER_DICTIONARY);
export type TReaderBlock = z.infer<typeof ReaderBlockSchema>;

export const ReaderDocumentSchema = z.record(z.string(), ReaderBlockSchema);
export type TReaderDocument = Record<string, TReaderBlock>;

const BaseReaderBlock = buildBlockComponent(READER_DICTIONARY);

export type TReaderBlockProps = { id: string };
export function ReaderBlock({ id }: TReaderBlockProps) {
  const document = useReaderDocument();
  return <BaseReaderBlock {...document[id]} />;
}

export type TReaderProps = {
  document: Record<string, z.infer<typeof ReaderBlockSchema>>,
  rootBlockId: string,
};
export default function Reader({ document, rootBlockId }: TReaderProps) {
  return (
    <ReaderContext.Provider value={document}>
      <ReaderBlock id={rootBlockId} />
    </ReaderContext.Provider>
  );
}
