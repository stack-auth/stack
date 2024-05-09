import { UserButton } from "@stackframe/stack";
import { Logo } from "./logo";
import { Separator } from "./ui/separator";

export function Navbar({ ...props }) {
  return (
    <div>
      <header
        className={`sticky top-0 z-30 flex items-center justify-between border-b-0 border-x-0 px-4 ${props.className || ""}`}
        style={{ height: `50px` }}
      >
        <div className={`flex items-center justify-center`}>
          <Logo full height={24} href="/projects" className="h-6" />
        </div>
        <UserButton />
      </header>
      <Separator/>
    </div>
  );
}
