import { StackProvider } from "@stackframe/stack";
import { stackServerApp } from "@/stack";
import { StackJoyTheme } from "@stackframe/stack";

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <StackProvider app={stackServerApp}>
      <StackJoyTheme>
        {props.children}
      </StackJoyTheme>
    </StackProvider>
  );
}
