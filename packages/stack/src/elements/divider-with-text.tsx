import { useDesign, useElements } from "@stackframe/stack-ui";

export default function DividerWithText({ text }: { text: string }) {
  const { Divider, Text } = useElements();
  const { colors } = useDesign();
  return (
    <div style={{ display: 'flex', alignItems: 'center', 'justifyContent': 'center', marginTop: '16px', marginBottom: '16px' }}>
      <Divider />
      <Text style={{ padding: '0 16px' }} variant="secondary">{text}</Text>
      <Divider />
    </div>
  );
  
}
