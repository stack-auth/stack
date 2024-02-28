import { Box } from "@mui/joy";
import { PageLoadingIndicator } from "@/components/page-loading-indicator";

export default function Loading() {
  return (
    <>
      <PageLoadingIndicator />
      <Box sx={{ height: '100vh' }} />
    </>
  );
}
