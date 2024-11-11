const { StackHandler } = require("@stackframe/stack");
const { stackServerApp } = require("../../../stack");

function Handler(props) {
  return <StackHandler fullPage app={stackServerApp} routeProps={props} />;
}

module.exports = Handler;
