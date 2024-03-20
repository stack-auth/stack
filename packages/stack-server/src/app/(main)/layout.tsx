import { StackProvider } from "@stackframe/stack";
import { stackServerApp } from "@/stack";
import { StackUIJoyProvider } from "@stackframe/stack-ui-joy";

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <StackProvider app={stackServerApp}>
      <StackUIJoyProvider>
        {props.children}
      </StackUIJoyProvider>
    </StackProvider>
  );
}
