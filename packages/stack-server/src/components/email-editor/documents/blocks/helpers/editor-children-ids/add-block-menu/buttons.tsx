import React from "react";  // explicitly import React to avoid issues with JSX eg. when running in non-Next.js server environments (Next.js always imports React first, but other environments may not)
import { TEditorBlock } from '../../../../editor/core';
import { BetweenHorizontalEnd, BoxSelect, Columns2, Heading, ImageIcon, Minus, RectangleHorizontal, Text } from 'lucide-react';

type TButtonProps = {
  label: string,
  icon: JSX.Element,
  block: () => TEditorBlock,
};
export const BUTTONS: TButtonProps[] = [
  {
    label: 'Heading',
    icon: <Heading className='w-5 h-5' />,
    block: () => ({
      type: 'Heading',
      data: {
        props: { text: 'Hello friend' },
        style: {
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
          color: '#000000',
        },
      },
    }),
  },
  {
    label: 'Text',
    icon: <Text className='w-5 h-5' />,
    block: () => ({
      type: 'Text',
      data: {
        props: { text: 'My new text block' },
        style: {
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
          fontWeight: 'normal',
          color: '#000000',
        },
      },
    }),
  },

  {
    label: 'Button',
    icon: <RectangleHorizontal className='w-5 h-5' />,
    block: () => ({
      type: 'Button',
      data: {
        props: {
          text: 'Button',
          buttonBackgroundColor: '#000000',
          buttonTextColor: '#FFFFFF',
        },
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
      },
    }),
  },
  {
    label: 'Image',
    icon: <ImageIcon className='w-5 h-5' />,
    block: () => ({
      type: 'Image',
      data: {
        props: {
          url: 'https://picsum.photos/300/200',
          alt: 'Sample product',
          contentAlignment: 'middle',
          linkHref: null,
        },
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
      },
    }),
  },
  {
    label: 'Divider',
    icon: <Minus className='w-5 h-5' />,
    block: () => ({
      type: 'Divider',
      data: {
        style: { padding: { top: 16, right: 0, bottom: 16, left: 0 } },
        props: {
          lineColor: '#CCCCCC',
        },
      },
    }),
  },
  {
    label: 'Spacer',
    icon: <BetweenHorizontalEnd className='w-5 h-5' />,
    block: () => ({
      type: 'Spacer',
      data: {},
    }),
  },
  {
    label: 'Columns',
    icon: <Columns2 className='w-5 h-5' />,
    block: () => ({
      type: 'ColumnsContainer',
      data: {
        props: {
          columnsGap: 16,
          columnsCount: 3,
          columns: [{ childrenIds: [] }, { childrenIds: [] }, { childrenIds: [] }],
        },
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
      },
    }),
  },
  {
    label: 'Container',
    icon: <BoxSelect className='w-5 h-5' />,
    block: () => ({
      type: 'Container',
      data: {
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
      },
    }),
  },
];
