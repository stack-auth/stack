'use client';

import { Separator, Text } from "../components-core";

export default function SeparatorWithText({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center my-6 stack-scope">
      <div className="flex-1">
        <Separator />
      </div>
      <Text variant="secondary" size='sm' className="mx-2">{text}</Text>
      <div className="flex-1">
        <Separator />
      </div>
    </div>
  );
}
