import { useState } from 'react';
import { ButtonProps, ButtonPropsDefaults, ButtonPropsSchema } from '../../../blocks/block-button';
import BaseSidebarPanel from './helpers/base-sidebar-panel';
import ColorInput from './helpers/inputs/color-input';
import TextInput from './helpers/inputs/text-input';
import MultiStylePropertyPanel from './helpers/style-inputs/multi-style-property-panel';
import { SingleToggleGroup } from './helpers/inputs/single-toggle-group';

type ButtonSidebarPanelProps = {
  data: ButtonProps,
  setData: (v: ButtonProps) => void,
};
export default function ButtonSidebarPanel({ data, setData }: ButtonSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);

  const updateData = (d: unknown) => {
    const res = ButtonPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  const text = data.props?.text ?? ButtonPropsDefaults.text;
  const url = data.props?.url ?? ButtonPropsDefaults.url;
  const fullWidth = data.props?.fullWidth ?? ButtonPropsDefaults.fullWidth;
  const size = data.props?.size ?? ButtonPropsDefaults.size;
  const buttonStyle = data.props?.buttonStyle ?? ButtonPropsDefaults.buttonStyle;
  const buttonTextColor = data.props?.buttonTextColor ?? ButtonPropsDefaults.buttonTextColor;
  const buttonBackgroundColor = data.props?.buttonBackgroundColor ?? ButtonPropsDefaults.buttonBackgroundColor;

  return (
    <BaseSidebarPanel title="Button block">
      <TextInput
        label="Text"
        defaultValue={text}
        onChange={(text) => updateData({ ...data, props: { ...data.props, text } })}
      />
      <TextInput
        label="Url"
        defaultValue={url}
        onChange={(url) => updateData({ ...data, props: { ...data.props, url } })}
      />
      <SingleToggleGroup
        label="Width"
        value={fullWidth ? 'FULL_WIDTH' : 'AUTO'}
        onValueChange={(v) => updateData({ ...data, props: { ...data.props, fullWidth: v === 'FULL_WIDTH' } })}
        items={[
          { value: 'FULL_WIDTH', label: 'Full' },
          { value: 'AUTO', label: 'Auto' },
        ]}
      />
      <SingleToggleGroup
        label="Size"
        value={size}
        onValueChange={(size) => updateData({ ...data, props: { ...data.props, size } })}
        items={[
          { value: 'x-small', label: 'Xs' },
          { value: 'small', label: 'Sm' },
          { value: 'medium', label: 'Md' },
          { value: 'large', label: 'Lg' },
        ]}
      />
      <SingleToggleGroup
        label="Style"
        value={buttonStyle}
        onValueChange={(buttonStyle) => updateData({ ...data, props: { ...data.props, buttonStyle } })}
        items={[
          { value: 'rectangle', label: 'Rectangle' },
          { value: 'rounded', label: 'Rounded' },
          { value: 'pill', label: 'Pill' },
        ]}
      />
      <ColorInput
        label="Text color"
        defaultValue={buttonTextColor}
        onChange={(buttonTextColor) => updateData({ ...data, props: { ...data.props, buttonTextColor } })}
      />
      <ColorInput
        label="Button color"
        defaultValue={buttonBackgroundColor}
        onChange={(buttonBackgroundColor) => updateData({ ...data, props: { ...data.props, buttonBackgroundColor } })}
      />
      <MultiStylePropertyPanel
        names={['backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
