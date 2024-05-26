import { useState } from 'react';
import { AvatarProps, AvatarPropsDefaults, AvatarPropsSchema } from '@usewaypoint/block-avatar';
import BaseSidebarPanel from './helpers/base-sidebar-panel';
import SliderInput from './helpers/inputs/slider-input';
import TextInput from './helpers/inputs/text-input';
import MultiStylePropertyPanel from './helpers/style-inputs/multi-style-property-panel';
import { SingleToggleGroup } from './helpers/inputs/single-toggle-group';
import { Scaling } from 'lucide-react';

type AvatarSidebarPanelProps = {
  data: AvatarProps,
  setData: (v: AvatarProps) => void,
};
export default function AvatarSidebarPanel({ data, setData }: AvatarSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);
  const updateData = (d: unknown) => {
    const res = AvatarPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  const size = data.props?.size ?? AvatarPropsDefaults.size;
  const imageUrl = data.props?.imageUrl ?? AvatarPropsDefaults.imageUrl;
  const alt = data.props?.alt ?? AvatarPropsDefaults.alt;
  const shape = data.props?.shape ?? AvatarPropsDefaults.shape;

  return (
    <BaseSidebarPanel title="Avatar block">
      <SliderInput
        label="Size"
        iconLabel={<Scaling className='h-4 w-4' />}
        units="px"
        step={3}
        min={32}
        max={256}
        defaultValue={size}
        onChange={(size) => {
          updateData({ ...data, props: { ...data.props, size } });
        }}
      />
      <SingleToggleGroup
        label="Shape"
        value={shape}
        onValueChange={(shape) => updateData({ ...data, props: { ...data.props, shape } })}
        items={[
          { value: 'circle', label: 'Circle' },
          { value: 'square', label: 'Square' },
          { value: 'rounded', label: 'Rounded' },
        ]}
      />
      <TextInput
        label="Image URL"
        defaultValue={imageUrl}
        onChange={(imageUrl) => {
          updateData({ ...data, props: { ...data.props, imageUrl } });
        }}
      />
      <TextInput
        label="Alt text"
        defaultValue={alt}
        onChange={(alt) => {
          updateData({ ...data, props: { ...data.props, alt } });
        }}
      />

      <MultiStylePropertyPanel
        names={['textAlign', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
