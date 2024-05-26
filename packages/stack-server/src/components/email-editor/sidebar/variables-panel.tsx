import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/copy-button';
import BaseSidebarPanel from './configuration-panel/input-panels/helpers/base-sidebar-panel';
import { Input } from '@/components/ui/input';
import { useMetadata } from '../documents/editor/editor-context';

export default function VariablesPanel() {
  const metadata = useMetadata();

  return (
    <BaseSidebarPanel title="Variables" tooltip='Variables can be used like {{ var }} in the strings. Mustache syntax is supported. Example values are shown in the preview.'>
      {metadata.variables.map((variable) => (
        <div key={variable.name} className="pb-2 border-b">
          <div className="flex items-center justify-between mt-1">
            <div className="mb-2 font-medium">{`{{ ${variable.name} }}`}</div>
            <CopyButton content={`{{ ${variable.name} }}`} />
          </div>
          <Label className="mt-2 text-gray-500 text-sm">Example Value:</Label>
          <Input
            placeholder={variable.example}
            className="mt-2"
          />
        </div>
      ))}
    </BaseSidebarPanel>
  );
}
