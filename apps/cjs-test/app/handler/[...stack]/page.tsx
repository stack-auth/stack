const { StackHandler } = require("@stackframe/stack");
const { stackServerApp } = require("../../../stack");

function Handler(props: any) {
  return <StackHandler app={stackServerApp} {...props} />;
}

module.exports = Handler;
