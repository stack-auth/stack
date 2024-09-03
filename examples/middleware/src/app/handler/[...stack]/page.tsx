import type { NextPage } from "next";
import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "../../../stack";

const Handler: NextPage = (props) => {
  return (
    <div style={{ backgroundColor: "white", borderRadius: 4 }}>
      <StackHandler fullPage app={stackServerApp} {...props} />
    </div>
  );
};

export default Handler;
