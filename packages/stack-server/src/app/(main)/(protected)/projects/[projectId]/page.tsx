import { Metadata } from "next";
import { Paragraph } from "@/components/paragraph";

export const metadata: Metadata = {
  title: "Overview",
};

export default function Home() {
  return (
    <>
      <Paragraph h1>
        Dashboard
      </Paragraph>

      <Paragraph body>
        Please use the sidebar.
      </Paragraph>
    </>
  );
}
