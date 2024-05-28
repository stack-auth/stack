import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/copy-button';
import BaseSidebarPanel from './configuration-panel/input-panels/helpers/base-sidebar-panel';
import { Input } from '@/components/ui/input';
import { useMetadata } from '../documents/editor/editor-context';
import Typography from '@/components/ui/typography';

export default function VariablesPanel() {
  const metadata = useMetadata();

  return (
    <BaseSidebarPanel title="Variables" tooltip='Variables can be used like {{ var }} in the strings. Handlebars syntax is supported. Example values are shown in the preview.'>
      {metadata.variables.map((variable) => (
        <div key={variable.name} className="pb-2 border-b">
          <div className="flex items-center justify-between mt-1">
            <Typography className="mb-2" type='label'>{`{{ ${variable.name} }}`}</Typography>
            <CopyButton content={`{{ ${variable.name} }}`} />
          </div>
          <Typography type='label' variant='secondary'>{variable.example}</Typography>
        </div>
      ))}
    </BaseSidebarPanel>
  );
}
