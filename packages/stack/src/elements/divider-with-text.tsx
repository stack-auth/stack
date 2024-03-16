import { useElements } from "@stackframe/stack-ui";

export default function DividerWithText({ text }: { text: string }) {
  const { Divider } = useElements();
  return (
    <div style={{ display: 'flex', alignItems: 'center', 'justifyContent': 'center', marginTop: '16px', marginBottom: '16px' }}>
      <Divider />
      <span style={{ padding: '0 16px', fontSize: '14px', color: 'neutral' }}>{text}</span>
      <Divider />
    </div>
  );
  
}
