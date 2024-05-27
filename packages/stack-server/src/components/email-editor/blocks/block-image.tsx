import React, { CSSProperties } from 'react';
import { z } from 'zod';

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

export const ImagePropsSchema = z.object({
  style: z
    .object({
      padding: PADDING_SCHEMA,
      backgroundColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional()
        .nullable(),
      textAlign: z.enum(['center', 'left', 'right']).optional().nullable(),
    })
    .optional()
    .nullable(),
  props: z
    .object({
      width: z.number().optional().nullable(),
      height: z.number().optional().nullable(),
      url: z.string().optional().nullable(),
      alt: z.string().optional().nullable(),
      linkHref: z.string().optional().nullable(),
      contentAlignment: z.enum(['top', 'middle', 'bottom']).optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type ImageProps = z.infer<typeof ImagePropsSchema>;

export function Image({ style, props }: ImageProps) {
  const sectionStyle: CSSProperties = {
    padding: getPadding(style?.padding),
    backgroundColor: style?.backgroundColor ?? undefined,
    textAlign: style?.textAlign ?? undefined,
  };

  const linkHref = props?.linkHref ?? null;
  const width = props?.width ?? undefined;
  const height = props?.height ?? undefined;

  const imageElement = (
    <img
      alt={props?.alt ?? ''}
      src={props?.url ?? ''}
      width={width}
      height={height}
      style={{
        width,
        height,
        outline: 'none',
        border: 'none',
        textDecoration: 'none',
        verticalAlign: props?.contentAlignment ?? 'middle',
        display: 'inline-block',
        maxWidth: '100%',
      }}
    />
  );

  if (!linkHref) {
    return <div style={sectionStyle}>{imageElement}</div>;
  }

  return (
    <div style={sectionStyle}>
      <a href={linkHref} style={{ textDecoration: 'none' }} target="_blank">
        {imageElement}
      </a>
    </div>
  );
}
