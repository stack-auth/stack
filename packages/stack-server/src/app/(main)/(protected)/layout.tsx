import { stackServerApp } from "@/stack";
import React from "react";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await stackServerApp.getUser({ or: 'redirect' });
  return <>{children}</>;
}