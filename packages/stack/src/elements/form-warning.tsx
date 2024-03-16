export function FormWarningText({ text }: { text?: string }) {
  if (!text) {
    return null;
  }
  return (
    <p className="wl_text-sm wl_text-red-500">
      {text}
    </p>
  );
}
