const { StackHandler } = require("@stackframe/stack");
const { stackServerApp } = require("../../../stack");
export default function Handler(props: any) {
  return <StackHandler app={stackServerApp} {...props} />;
}
