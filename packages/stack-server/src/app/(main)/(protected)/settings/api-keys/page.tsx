import { Paragraph } from "@/components/paragraph";
import ApiKeysDashboardClient from "./page-client";

export const metadata = {
  title: "API Keys",
};

export default function ApiKeysDashboard() {
  return (
    <ApiKeysDashboardClient />
  );
}
