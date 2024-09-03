"use client";

export function FormWarningText({ text }: { text?: string }) {
  if (!text) {
    return null;
  }
  return <div className="mt-1 text-sm text-red-500">{text}</div>;
}
