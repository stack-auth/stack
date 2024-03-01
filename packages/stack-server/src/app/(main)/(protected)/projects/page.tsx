import { Stack } from "@mui/joy";
import ProjectsPageClient from "./page-client";
import { Header } from "./header";

export const metadata = {
  title: "Projects",
};

export default function ProjectsPage() {
  const headerHeight = 50;
  return (
    <Stack direction="column">
      <Header headerHeight={headerHeight} />
      <Stack p={2}>
        <ProjectsPageClient />
      </Stack>
    </Stack>
  );
}
