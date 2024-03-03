"use client";

import { Button, Card, CardContent, CardOverflow, Divider, FormControl, FormLabel, Grid, Input, Stack, Textarea, Typography } from "@mui/joy";
import { use, useId, useRef, useState } from "react";
import { useStackApp } from "stack";
import { prettyPrintWithMagnitudes } from "stack-shared/dist/utils/numbers";
import { Dialog } from "@/components/dialog";
import { Paragraph } from "@/components/paragraph";
import { SmartLink } from "@/components/smart-link";
import { useFromNow } from "@/hooks/use-from-now";
import { useStrictMemo } from "stack-shared/src/hooks/use-strict-memo";
import { runAsynchronously } from "stack-shared/src/utils/promises";
import { Project } from "stack/dist/lib/stack-app";


export default function ProjectsPageClient() {
  const [invalidationCounter, setInvalidationCounter] = useState(0);
  const stackApp = useStackApp({ projectIdMustMatch: "internal" });
  
  const projectsPromise = useStrictMemo(() => {
    return stackApp.listOwnedProjects();
  }, [invalidationCounter]);
  const projects = use(projectsPromise);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <Stack alignItems="center" spacing={4}>
        <Paragraph h1>
          Projects
        </Paragraph>

        <Button color="primary" variant="solid" onClick={() => setCreateDialogOpen(true)}>
          Create new
        </Button>

        <Grid container spacing={2} width='100%' justifyContent='center'>
          {projects.map((project) => (
            <Grid key={project.id} xs={12} sm={6} md={4}>
              <ProjectCard project={project} />
            </Grid>
          ))}
        </Grid>
      </Stack>

      <CreateProjectDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onInvalidate={() => setInvalidationCounter((x) => x + 1)}
      />
    </>
  );
}

function ProjectCard(props: {
  project: Project,
}) {
  const createdAt = useFromNow(props.project.createdAt);

  const singleLineCss = {
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
  };

  return (
    <SmartLink href={`/projects/${encodeURIComponent(props.project.id)}`} sx={{ color: "inherit" }}>
      <Card variant="outlined">
        <CardContent>
          <Typography level="title-md" sx={singleLineCss}>{props.project.displayName}</Typography>
          <Typography level="body-sm" sx={singleLineCss}>{props.project.description}</Typography>
        </CardContent>
        <CardOverflow variant="soft" sx={{ bgcolor: 'background.level1' }}>
          <Divider inset="context" />
          <CardContent orientation="horizontal">
            <Typography level="body-xs" fontWeight="md" textColor="text.secondary" sx={singleLineCss}>
              {prettyPrintWithMagnitudes(props.project.userCount)} users
            </Typography>
            <Divider orientation="vertical" />
            <Typography level="body-xs" fontWeight="md" textColor="text.secondary" sx={singleLineCss}>
              {createdAt}
            </Typography>
          </CardContent>
        </CardOverflow>
      </Card>
    </SmartLink>
  );
}

function CreateProjectDialog(props: { open: boolean, onClose(): void, onInvalidate(): void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const formId = useId();
  const [isCreating, setIsCreating] = useState(false);
  const stackApp = useStackApp({ projectIdMustMatch: "internal" });

  return (
    <Dialog
      titleIcon="library_add"
      title="Create new project"
      cancelButton
      okButton={{
        label: "Create",
        onClick: async () => "prevent-close",
        props: {
          type: "submit",
          form: formId,
          loading: isCreating,
        },
      }}
      disableButtons={isCreating}
      open={props.open}
      onClose={props.onClose}
    >
      <form
        id={formId}
        onSubmit={(event) => {
          runAsynchronously(async () => {
            event.preventDefault();
            setIsCreating(true);
            try {
              const formData = new FormData(event.currentTarget);
              await stackApp.createProject({
                displayName: `${formData.get('name')}`,
                description: `${formData.get('description')}`,
              });
              props.onInvalidate();
              props.onClose();
            } finally {
              setIsCreating(false);
            }
          });
        }}
        ref={formRef}
      >
        <Stack spacing={2}>
          <FormControl required disabled={isCreating}>
            <FormLabel htmlFor="name">Name</FormLabel>
            <Input name="name" />
          </FormControl>
          <FormControl disabled={isCreating}>
            <FormLabel htmlFor="description">Description</FormLabel>
            <Textarea name="description" minRows={3} />
          </FormControl>
        </Stack>
      </form>
    </Dialog>
  );
}
