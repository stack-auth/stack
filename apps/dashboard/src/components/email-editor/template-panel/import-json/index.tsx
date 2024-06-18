import React, { useState } from 'react';
import ImportJsonDialog from './import-json-dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export default function ImportJson() {
  const [open, setOpen] = useState(false);

  let dialog = null;
  if (open) {
    dialog = <ImportJsonDialog onClose={() => setOpen(false)} />;
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant='secondary' className='gap-2'>
        <Upload className='w-4 h-4' />
        Import JSON
      </Button>
      {dialog}
    </>
  );
}
