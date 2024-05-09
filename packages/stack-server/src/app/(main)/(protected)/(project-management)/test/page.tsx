import PageClient from "./page-client";
import Footer from "./footer";

export default function Page() {
  return (
    <>
      <div className="flex-grow p-4">
        <PageClient />
      </div>
      <Footer />
    </>
  );
}