import { Navbar } from "@/components/navbar";

export default function Page({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
