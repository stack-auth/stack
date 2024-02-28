import { StackProvider } from "stack";
import { stackServerApp } from "@/stack";

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <StackProvider app={stackServerApp}>
      {props.children}
    </StackProvider>
  );
}
