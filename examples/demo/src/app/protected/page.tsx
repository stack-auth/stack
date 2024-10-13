import { stackServerApp } from "src/stack";

export default async function ProtectedPage() {
  await stackServerApp.getUser({ or: 'redirect' });
  return <div>This is protected. You can see this because you are signed in</div>;
}
