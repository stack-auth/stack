import { useState } from 'react';

import { setDocument, useDocument } from '../documents/editor/editor-context';

import EmailLayoutPropsSchema from '../documents/blocks/email-layout/email-layout-props-schema';
import BaseSidebarPanel from './configuration-panel/input-panels/helpers/base-sidebar-panel';
import ColorInput from './configuration-panel/input-panels/helpers/inputs/color-input';
import { NullableFontFamily } from './configuration-panel/input-panels/helpers/inputs/font-family';

export default function SettingsPanel() {
  const block = useDocument().root;
  const [, setErrors] = useState<Zod.ZodError | null>(null);

  if (!block) {
    return <p>Block not found</p>;
  }

  const { data, type } = block;
  if (type !== 'EmailLayout') {
    throw new Error('Expected "root" element to be of type EmailLayout');
  }

  const updateData = (d: unknown) => {
    const res = EmailLayoutPropsSchema.safeParse(d);
    if (res.success) {
      setDocument({ root: { type, data: res.data } });
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  return (
    <BaseSidebarPanel title="Settings">
      <ColorInput
        label="Backdrop color"
        defaultValue={data.backdropColor ?? '#F5F5F5'}
        onChange={(backdropColor) => updateData({ ...data, backdropColor })}
      />
      <ColorInput
        label="Canvas color"
        defaultValue={data.canvasColor ?? '#FFFFFF'}
        onChange={(canvasColor) => updateData({ ...data, canvasColor })}
      />

      <NullableFontFamily
        label="Font family"
        defaultValue="MODERN_SANS"
        onChange={(fontFamily) => updateData({ ...data, fontFamily })}
      />
      <ColorInput
        label="Text color"
        defaultValue={data.textColor ?? '#262626'}
        onChange={(textColor) => updateData({ ...data, textColor })}
      />
    </BaseSidebarPanel>
  );
}


{/* <Stack alignItems="flex-start">
<InputLabel sx={{ mb: 0.5 }}>{label}</InputLabel>
<Stack direction="row" spacing={1}>
  {renderOpenButton()}
  {renderResetButton()}
</Stack>
<Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={() => setAnchorEl(null)}
  MenuListProps={{
    sx: { height: 'auto', padding: 0 },
  }}
>
  <ColorPicker
    value={value || ''}
    onChange={(v) => {
      setValue(v);
      onChange(v);
    }}
  />
</Menu>
</Stack> */}