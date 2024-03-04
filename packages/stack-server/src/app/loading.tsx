import { PageLoadingIndicator } from "@/components/page-loading-indicator";
import { Paragraph } from "@/components/paragraph";

export default function Loading() {
  return (
    <Paragraph body>
      <PageLoadingIndicator />
    </Paragraph>
  );
}
