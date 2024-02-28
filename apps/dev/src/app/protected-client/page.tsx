'use client';
import { useUser } from "stack";

export default function ProtectedPage() {
  useUser({ or: 'redirect' });
  return <div>This is protected. You can see this because you are signed in</div>;
}