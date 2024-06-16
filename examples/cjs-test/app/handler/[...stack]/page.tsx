import { StackHandler } from "@stackframe/stack";
const { stackServerApp } = require("../../../stack");

function Handler(props: any) {
  return <StackHandler fullPage app={stackServerApp} {...props} />;
}

module.exports = Handler;
