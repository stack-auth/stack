import { stackServerApp } from "src/stack";
import { StackHandler } from "@stackframe/stack";

export default function Handler(props) {
  return <StackHandler fullPage app={stackServerApp} {...props} />;
}
