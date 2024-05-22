import React, { useEffect, useState } from 'react';

import { html, json } from './highlighters';

type TextEditorPanelProps = {
  type: 'json' | 'html',
  value: string,
};
export default function HighlightedCodePanel({ type, value }: TextEditorPanelProps) {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    switch (type) {
      case 'html': {
        html(value).then(setCode).catch(console.error);
        return;
      }
      case 'json': {
        json(value).then(setCode).catch(console.error);
        return;
      }
    }
  }, [setCode, value, type]);

  if (code === null) {
    return null;
  }

  return (
    <pre
      style={{ margin: 0, padding: 16 }}
      dangerouslySetInnerHTML={{ __html: code }}
      onClick={(ev) => {
        const s = window.getSelection();
        if (s === null) {
          return;
        }
        s.selectAllChildren(ev.currentTarget);
      }}
    />
  );
}
