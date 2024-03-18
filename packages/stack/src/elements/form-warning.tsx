import { Text } from "@stackframe/stack-ui";

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
