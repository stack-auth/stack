'use client';

import { Divider, Text } from "../components-core";

export default function DividerWithText({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '16px', marginBottom: '16px' }}>
      <div style={{ flex: 1 }}>
        <Divider />
      </div>
      <Text style={{ padding: '0 16px' }} variant="secondary" size='sm'>{text}</Text>
      <div style={{ flex: 1 }}>
        <Divider />
      </div>
    </div>
  );
}
