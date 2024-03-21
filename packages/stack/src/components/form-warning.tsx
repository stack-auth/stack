import { Text } from "../components-core";

export function FormWarningText({ text }: { text?: string }) {
  if (!text) {
    return null;
  }
  return (
    <Text size="sm" variant="warning">
      {text}
    </Text>
  );
}
