import { SignIn } from "@stackframe/stack";

export default function SimpleDivFullPageDemo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <SignIn fullPage />
    </div>
  );
}
