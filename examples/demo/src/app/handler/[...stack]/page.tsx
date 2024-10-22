import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "src/stack";

export default function Handler(props) {
  return (
    <StackHandler fullPage app={stackServerApp} /* @next-codemod-error 'props' is used with spread syntax (...). Any asynchronous properties of 'props' must be awaited when accessed. */
    {...props} />
  );
}
