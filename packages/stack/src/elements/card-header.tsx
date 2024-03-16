import { useElements } from "@stackframe/stack-ui";

export default function CardHeader(
  { children, title }: 
  { children?: React.ReactNode, title: string }
) {
  const { Text } = useElements();
  return (
    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
      <Text size="xl" as='h2' style={{ marginBottom: '5px' }}>{title}</Text>
      {children}
    </div>
  );
}