import React from 'react';
import { z } from 'zod';
import { Button as ReactEmailButton } from '@react-email/components';

const FONT_FAMILY_SCHEMA = z
  .enum([
    'MODERN_SANS',
    'BOOK_SANS',
    'ORGANIC_SANS',
    'GEOMETRIC_SANS',
    'HEAVY_SANS',
    'ROUNDED_SANS',
    'MODERN_SERIF',
    'BOOK_SERIF',
    'MONOSPACE',
  ])
  .nullable()
  .optional();

function getFontFamily(fontFamily: z.infer<typeof FONT_FAMILY_SCHEMA>) {
  switch (fontFamily) {
    case 'MODERN_SANS': {
      return '"Helvetica Neue", "Arial Nova", "Nimbus Sans", Arial, sans-serif';
    }
    case 'BOOK_SANS': {
      return 'Optima, Candara, "Noto Sans", source-sans-pro, sans-serif';
    }
    case 'ORGANIC_SANS': {
      return 'Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif';
    }
    case 'GEOMETRIC_SANS': {
      return 'Avenir, "Avenir Next LT Pro", Montserrat, Corbel, "URW Gothic", source-sans-pro, sans-serif';
    }
    case 'HEAVY_SANS': {
      return 'Bahnschrift, "DIN Alternate", "Franklin Gothic Medium", "Nimbus Sans Narrow", sans-serif-condensed, sans-serif';
    }
    case 'ROUNDED_SANS': {
      return 'ui-rounded, "Hiragino Maru Gothic ProN", Quicksand, Comfortaa, Manjari, "Arial Rounded MT Bold", Calibri, source-sans-pro, sans-serif';
    }
    case 'MODERN_SERIF': {
      return 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif';
    }
    case 'BOOK_SERIF': {
      return '"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif';
    }
    case 'MONOSPACE': {
      return '"Nimbus Mono PS", "Courier New", "Cutive Mono", monospace';
    }
    default: {
      return undefined;
    }
  }
}

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

export const ButtonPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: COLOR_SCHEMA,
      fontSize: z.number().min(0).optional().nullable(),
      fontFamily: FONT_FAMILY_SCHEMA,
      fontWeight: z.enum(['bold', 'normal']).optional().nullable(),
      textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
      padding: PADDING_SCHEMA,
    })
    .optional()
    .nullable(),
  props: z
    .object({
      buttonBackgroundColor: COLOR_SCHEMA,
      buttonStyle: z.enum(['rectangle', 'pill', 'rounded']).optional().nullable(),
      buttonTextColor: COLOR_SCHEMA,
      fullWidth: z.boolean().optional().nullable(),
      size: z.enum(['x-small', 'small', 'large', 'medium']).optional().nullable(),
      text: z.string().optional().nullable(),
      url: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type ButtonProps = z.infer<typeof ButtonPropsSchema>;

function getRoundedCorners(props: ButtonProps['props']) {
  const buttonStyle = props?.buttonStyle ?? ButtonPropsDefaults.buttonStyle;

  switch (buttonStyle) {
    case 'rectangle': {
      return undefined;
    }
    case 'pill': {
      return 64;
    }
    case 'rounded': 
    default: {
      return 4;
    }
  }
}

function getButtonSizePadding(props: ButtonProps['props']) {
  const size = props?.size ?? ButtonPropsDefaults.size;
  switch (size) {
    case 'x-small': {
      return [4, 8] as const;
    }
    case 'small': {
      return [8, 12] as const;
    }
    case 'large': {
      return [16, 32] as const;
    }
    case 'medium': 
    default: {
      return [12, 20] as const;
    }
  }
}

export const ButtonPropsDefaults = {
  text: '',
  url: '',
  fullWidth: false,
  size: 'medium',
  buttonStyle: 'rounded',
  buttonTextColor: '#FFFFFF',
  buttonBackgroundColor: '#000000',
} as const;

export function Button({ style, props }: ButtonProps) {
  const text = props?.text ?? ButtonPropsDefaults.text;
  const url = props?.url ?? ButtonPropsDefaults.url;
  const fullWidth = props?.fullWidth ?? ButtonPropsDefaults.fullWidth;
  const buttonTextColor = props?.buttonTextColor ?? ButtonPropsDefaults.buttonTextColor;
  const buttonBackgroundColor = props?.buttonBackgroundColor ?? ButtonPropsDefaults.buttonBackgroundColor;

  const padding = getButtonSizePadding(props);
  const wrapperStyle: React.CSSProperties = {
    backgroundColor: style?.backgroundColor ?? undefined,
    textAlign: style?.textAlign ?? undefined,
    padding: getPadding(style?.padding),
  };
  const buttonStyle: React.CSSProperties = {
    color: buttonTextColor,
    fontSize: style?.fontSize ?? 16,
    fontFamily: getFontFamily(style?.fontFamily),
    fontWeight: style?.fontWeight ?? 'bold',
    backgroundColor: buttonBackgroundColor,
    borderRadius: getRoundedCorners(props),
    display: fullWidth ? 'block' : 'inline-block',
    padding: `${padding[0]}px ${padding[1]}px`,
    textDecoration: 'none',
  };

  return (
    <div style={wrapperStyle}>
      <ReactEmailButton
        href={url}
        style={buttonStyle}
        target="_blank"
      >
        {text}
      </ReactEmailButton>
    </div>
  );
}
