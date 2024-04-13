'use client';

import { Separator, Text } from "../components-core";

export default function SeparatorWithText({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ flex: 1 }}>
        <Separator />
      </div>
      <Text style={{ padding: '0 16px' }} variant="secondary" size='sm'>{text}</Text>
      <div style={{ flex: 1 }}>
        <Separator />
      </div>
    </div>
  );
}
