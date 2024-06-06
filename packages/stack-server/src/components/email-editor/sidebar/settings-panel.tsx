import { useState } from 'react';
import { setDocument, setSubject, useDocument, useSubject } from '../documents/editor/editor-context';
import EmailLayoutPropsSchema from '../documents/blocks/email-layout/email-layout-props-schema';
import BaseSidebarPanel from './configuration-panel/input-panels/helpers/base-sidebar-panel';
import ColorInput from './configuration-panel/input-panels/helpers/inputs/color-input';
import { NullableFontFamily } from './configuration-panel/input-panels/helpers/inputs/font-family';
import DownloadJson from '../template-panel/download-json';
import ImportJson from '../template-panel/import-json';
import { Label } from '@/components/ui/label';
import TextInput from './configuration-panel/input-panels/helpers/inputs/text-input';

export default function SettingsPanel() {
  const block = useDocument().root;
  const [, setErrors] = useState<Zod.ZodError | null>(null);
  const subject = useSubject();

  // eslint-disable-next-line
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
      <TextInput
        label='Email Subject'
        rows={3}
        defaultValue={subject}
        onChange={(subject) => setSubject(subject)}
      />

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

      <div className='flex flex-col gap-2'>
        <Label>Import & export</Label>
        <div className="flex flex-col gap-2">
          <DownloadJson />
          <ImportJson />
        </div>
      </div>

    </BaseSidebarPanel>
  );
}
