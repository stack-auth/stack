import { useDesign, useElements } from "@stackframe/stack-ui";

export default function DividerWithText({ text }: { text: string }) {
  const { Divider, Text } = useElements();
  const { colors } = useDesign();
  return (
    <div style={{ display: 'flex', alignItems: 'center', 'justifyContent': 'center', marginTop: '16px', marginBottom: '16px' }}>
      <div style={{ flex: 1 }}>
        <Divider />
      </div>
      <Text style={{ padding: '0 16px' }} variant="secondary">{text}</Text>
      <div style={{ flex: 1 }}>
        <Divider />
      </div>
    </div>
  );
  
}
