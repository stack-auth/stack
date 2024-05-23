import { Box, Tab, Tabs } from '@mui/material';
import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/copy-button';

const testVars = [
  { name: 'name', label: 'User Name' },
  { name: 'email', label: 'User Email' },
];

export default function VariablesPanel() {
  return (
    <div className="flex flex-col">
      {testVars.map((variable) => (
        <div key={variable.name} className="px-4 py-2 border-b">
          <Label>{variable.label}</Label>
          <div className="flex items-center justify-between mt-1">
            <div className="text-gray-500">{`{{ ${variable.name} }}`}</div>
            <CopyButton content={`{{ ${variable.name} }}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
