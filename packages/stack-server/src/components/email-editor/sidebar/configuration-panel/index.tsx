import React from 'react';

import { Box, Typography } from '@mui/material';

import { TEditorBlock } from '../../documents/editor/core';
import { setDocument, useDocument, useSelectedBlockId } from '../../documents/editor/editor-context';

import AvatarSidebarPanel from './input-panels/avatar-sidebar-panel';
import ButtonSidebarPanel from './input-panels/button-sidebar-panel';
import ColumnsContainerSidebarPanel from './input-panels/columns-container-sidebar-panel';
import ContainerSidebarPanel from './input-panels/container-sidebar-panel';
import DividerSidebarPanel from './input-panels/divider-sidebar-panel';
import EmailLayoutSidebarPanel from './input-panels/email-layout-sidebar-panel';
import HeadingSidebarPanel from './input-panels/heading-sidebar-panel';
import HtmlSidebarPanel from './input-panels/html-sidebar-panel';
import ImageSidebarPanel from './input-panels/image-sidebar-panel';
import SpacerSidebarPanel from './input-panels/spacer-sidebar-panel';
import TextSidebarPanel from './input-panels/text-sidebar-panel';

function renderMessage(val: string) {
  return (
    <Box sx={{ m: 3, p: 1, border: '1px dashed', borderColor: 'divider' }}>
      <Typography color="text.secondary">{val}</Typography>
    </Box>
  );
}

export default function ConfigurationPanel() {
  const document = useDocument();
  const selectedBlockId = useSelectedBlockId();

  if (!selectedBlockId) {
    return renderMessage('Click on a block to inspect.');
  }
  const block = document[selectedBlockId];
  if (!block) {
    return renderMessage(`Block with id ${selectedBlockId} was not found. Click on a block to reset.`);
  }

  const setBlock = (conf: TEditorBlock) => setDocument({ [selectedBlockId]: conf });
  const { data, type } = block;
  switch (type) {
    case 'Avatar': {
      return <AvatarSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />;
    }
    case 'Button': {
      return <ButtonSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />;
    }
    case 'ColumnsContainer': {
      return (
        <ColumnsContainerSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
      );
    }
    case 'Container': {
      return <ContainerSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />;
    }
    case 'Divider': {
      return <DividerSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />;
    }
    case 'Heading': {
      return <HeadingSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />;
    }
    case 'Html': {
      return <HtmlSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />;
    }
    case 'Image': {
      return <ImageSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />;
    }
    case 'EmailLayout': {
      return <EmailLayoutSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />;
    }
    case 'Spacer': {
      return <SpacerSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />;
    }
    case 'Text': {
      return <TextSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />;
    }
    default: {
      return <pre>{JSON.stringify(block, null, '  ')}</pre>;
    }
  }
}
