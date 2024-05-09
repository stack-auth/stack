import { Navbar } from "@/components/navbar";
import PageClient from "./page-client";
import PageFooter from "./page-footer";

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow p-4">
        <PageClient />
      </div>
      <PageFooter />
    </div>
  );
}