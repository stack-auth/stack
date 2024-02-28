import { StackHandler } from "stack";
import { stackServerApp } from "src/stack";

export default function Handler(props) {
  return <StackHandler app={stackServerApp} {...props} />;
}
