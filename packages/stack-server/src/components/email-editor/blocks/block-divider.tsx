import React, { CSSProperties } from 'react';
import { z } from 'zod';

const COLOR_SCHEMA = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .nullable()
  .optional();

const PADDING_SCHEMA = z
  .object({
    top: z.number(),
    bottom: z.number(),
    right: z.number(),
    left: z.number(),
  })
  .optional()
  .nullable();

const getPadding = (padding: z.infer<typeof PADDING_SCHEMA>) =>
  padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined;

export const DividerPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: COLOR_SCHEMA,
      padding: PADDING_SCHEMA,
    })
    .optional()
    .nullable(),
  props: z
    .object({
      lineColor: COLOR_SCHEMA,
      lineHeight: z.number().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type DividerProps = z.infer<typeof DividerPropsSchema>;

export const DividerPropsDefaults = {
  lineHeight: 1,
  lineColor: '#333333',
};

export function Divider({ style, props }: DividerProps) {
  const st: CSSProperties = {
    padding: getPadding(style?.padding),
    backgroundColor: style?.backgroundColor ?? undefined,
  };
  const borderTopWidth = props?.lineHeight ?? DividerPropsDefaults.lineHeight;
  const borderTopColor = props?.lineColor ?? DividerPropsDefaults.lineColor;
  return (
    <div style={st}>
      <hr
        style={{
          width: '100%',
          border: 'none',
          borderTop: `${borderTopWidth}px solid ${borderTopColor}`,
          margin: 0,
        }}
      />
    </div>
  );
}
