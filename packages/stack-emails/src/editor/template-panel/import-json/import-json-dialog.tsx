import React, { useState } from 'react';
import { resetDocument } from '../../documents/editor/editor-context';
import validateJsonStringValue from './validateJsonStringValue';
import { ActionDialog } from '../../../components/action-dialog';
import Typography from '../../../components/ui/typography';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../components/ui/use-toast';

type ImportJsonDialogProps = {
  onClose: () => void,
};
export default function ImportJsonDialog({ onClose }: ImportJsonDialogProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement> = (ev) => {
    const v = ev.currentTarget.value;
    setValue(v);
    const { error } = validateJsonStringValue(v);
    setError(error ?? null);
  };

  return (
    <ActionDialog
      title="Import JSON"
      open={true}
      onClose={onClose}
      okButton={{
        label: 'Import',
        onClick: async () => {
          const { error, data } = validateJsonStringValue(value);
          setError(error ?? null);
          if (!data) {
            return;
          }
          resetDocument(data);
          onClose();
          toast({ title: 'Imported JSON' });
        },
        props: {
          disabled: error !== null,
        }
      }}
      cancelButton
    >
      <form className='flex flex-col w-full gap-4'>
        <Typography>
        Copy and paste an email JSON
        </Typography>
        <Textarea
          value={value}
          onChange={handleChange}
          rows={10}
        />
        {error && <Typography variant='destructive' type='label'>
          {error}
        </Typography>}
      </form>
    </ActionDialog>
  );
}
