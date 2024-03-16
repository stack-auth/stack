import { useElements } from "@stackframe/stack-ui";

export function FormWarningText({ text }: { text?: string }) {
  const { Text } = useElements();
  if (!text) {
    return null;
  }
  return (
    <Text size="sm" variant="warning">
      {text}
    </Text>
  );
}
