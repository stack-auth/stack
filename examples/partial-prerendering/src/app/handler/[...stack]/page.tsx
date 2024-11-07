import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "../../../stack";

export default function Handler(props: any) {
  return (
    <div style={{ backgroundColor: "white", borderRadius: 4 }}>
      <StackHandler fullPage app={stackServerApp} routeProps={props} />
    </div>
  );
}
