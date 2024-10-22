import { MessageCard } from "@stackframe/stack";

export default function NotFound() {
  return (
    <MessageCard title="404 Page Not Found" fullPage>
      <p>The page you are looking for does not exist.</p>
    </MessageCard>
  );
}
