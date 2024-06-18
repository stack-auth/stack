import { useState } from 'react';
import { HeadingProps, HeadingPropsDefaults, HeadingPropsSchema } from '../../../blocks/block-heading';
import BaseSidebarPanel from './helpers/base-sidebar-panel';
import TextInput from './helpers/inputs/text-input';
import MultiStylePropertyPanel from './helpers/style-inputs/multi-style-property-panel';
import { SingleToggleGroup } from './helpers/inputs/single-toggle-group';

type HeadingSidebarPanelProps = {
  data: HeadingProps,
  setData: (v: HeadingProps) => void,
};
export default function HeadingSidebarPanel({ data, setData }: HeadingSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);

  const updateData = (d: unknown) => {
    const res = HeadingPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  return (
    <BaseSidebarPanel title="Heading block">
      <TextInput
        label="Content"
        rows={3}
        defaultValue={data.props?.text ?? HeadingPropsDefaults.text}
        onChange={(text) => {
          updateData({ ...data, props: { ...data.props, text } });
        }}
      />
      <SingleToggleGroup
        label="Level"
        value={data.props?.level ?? HeadingPropsDefaults.level}
        onValueChange={(level) => {
          updateData({ ...data, props: { ...data.props, level } });
        }}
        items={[
          { value: 'h1', label: 'H1' },
          { value: 'h2', label: 'H2' },
          { value: 'h3', label: 'H3' },
        ]}
      />
      <MultiStylePropertyPanel
        names={['color', 'backgroundColor', 'fontFamily', 'fontWeight', 'textAlign', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
