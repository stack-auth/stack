'use client';

export function FormWarningText({ text }: { text?: string }) {
  if (!text) {
    return null;
  }
  return (
    <div className="text-red-500 text-sm mt-1">
      {text}
    </div>
  );
}
