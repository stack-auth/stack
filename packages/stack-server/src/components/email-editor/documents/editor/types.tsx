import React from 'react';
import { z } from 'zod';
import { Avatar, AvatarPropsSchema } from '@usewaypoint/block-avatar';
import { Button, ButtonPropsSchema } from '@usewaypoint/block-button';
import { Divider, DividerPropsSchema } from '@usewaypoint/block-divider';
import { Heading, HeadingPropsSchema } from '@usewaypoint/block-heading';
import { Image, ImagePropsSchema } from '@usewaypoint/block-image';
import { Spacer, SpacerPropsSchema } from '@usewaypoint/block-spacer';
import { Text, TextPropsSchema } from '../../block-text';
import {
  buildBlockComponent,
  buildBlockConfigurationDictionary,
  buildBlockConfigurationSchema,
} from '@usewaypoint/document-core';
import ColumnsContainerEditor from '../blocks/columns-container/columns-container-editor';
import ColumnsContainerPropsSchema from '../blocks/columns-container/columns-container-props-schema';
import ContainerEditor from '../blocks/container/container-editor';
import ContainerPropsSchema from '../blocks/container/container-props-schema';
import EmailLayoutEditor from '../blocks/email-layout/email-layout-editor';
import EmailLayoutPropsSchema from '../blocks/email-layout/email-layout-props-schema';
import EditorBlockWrapper from '../blocks/helpers/block-wrappers/editor-block-wrapper';


export const EditorBlock = buildBlockComponent(EDITOR_DICTIONARY);
export const EditorBlockSchema = buildBlockConfigurationSchema(EDITOR_DICTIONARY);
export const EditorConfigurationSchema = z.record(z.string(), EditorBlockSchema);

export type TEditorBlock = z.infer<typeof EditorBlockSchema>;
export type TEditorConfiguration = Record<string, TEditorBlock>;
