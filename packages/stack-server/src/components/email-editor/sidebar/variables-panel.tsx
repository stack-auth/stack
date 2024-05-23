import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/copy-button';
import BaseSidebarPanel from './configuration-panel/input-panels/helpers/base-sidebar-panel';
import { Input } from '@/components/ui/input';

const testVars = [
  { name: 'name', label: 'User Name', example: 'John Doe' },
  { name: 'email', label: 'User Email', example: 'test@email.com' },
];

export default function VariablesPanel() {
  return (
    <BaseSidebarPanel title="Variables" tooltip='Variables can be used like {{ var }} in the strings. Mustache syntax is supported. Example values are shown in the preview.'>
      {testVars.map((variable) => (
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
