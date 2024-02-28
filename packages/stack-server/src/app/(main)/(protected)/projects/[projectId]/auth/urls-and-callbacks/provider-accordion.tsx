"use client";

import { Accordion, AccordionDetails, AccordionSummary, MenuItem, Select, Option, Typography, Box, Stack, BoxProps, FormControl, FormLabel, Input } from "@mui/joy";
import { OauthProviderConfigJson } from "stack-shared";
import { useState } from "react";
import { typedIncludes } from "stack-shared/dist/utils/arrays";
import { Paragraph } from "@/components/paragraph";
import { AsyncButton } from "@/components/async-button";

/**
 * All the different types of Oauth providers that can be created.
 */
export const allCreationTypes = [
  "google",
  "linkedin",
  "facebook",
  "github",
  "twitter",
  "slack",
  "microsoft",
] as const;
export type CreationType = typeof allCreationTypes[number];
export function getCreationType(provider: OauthProviderConfigJson): CreationType | null {
  const id = provider.id;
  if (typedIncludes(allCreationTypes, id)) {
    return id;
  }
  return null;
}

type Props<ProviderExtra = {}> =
  & {
    createProvider?: (provider: OauthProviderConfigJson) => void,
    updateProvider?: (provider: OauthProviderConfigJson) => void,
  }
  & (
    | {
      provider: OauthProviderConfigJson & ProviderExtra,
      createType?: never,
    }
    | {
      createType: CreationType,
      provider?: never,
    }
  );

export function ProviderAccordion(props: Props) {
  if (props.provider) {
    switch (props.provider.type) {
      case "google":
      case "shared-google":
      case "github":
      case "shared-github":
      case "facebook":
      case "shared-facebook":
      case "twitter":
      case "shared-twitter":
      case "linkedin":
      case "shared-linkedin":
      case "slack":
      case "shared-slack": 
      case "microsoft":
      case "shared-microsoft": {
        return <StandardProviderAccordion {...props as any} />;
      }
    }
  } else if (props.createType) {
    switch (props.createType) {
      case "google": {
        return <GoogleProviderAccordion {...props as any} />;
      }
      case "github":
      case "facebook":
      case "twitter":
      case "linkedin":
      case "slack": 
      case "microsoft": {
        return <StandardProviderAccordion {...props as any} />;
      }
    }
  } else {
    throw new Error("ProviderAccordion must have either renderType or provider");
  }
}

function GoogleProviderAccordion(props: Props<{ type: "google" }>) {
  return (
    <AccordionWrapper
      title={props.createType || props.provider.id === "google" ? "Google" : `Custom Google provider: ${props.provider.id}`}
    >
      <ProviderForm {...props} />
    </AccordionWrapper>
  );
}

function StandardProviderAccordion(props: Props<{ clientId: string, clientSecret: string }>) {
  const title = {
    github: "GitHub",
    facebook: "Facebook",
    twitter: "Twitter",
    linkedin: "LinkedIn",
    slack: "Slack",
    microsoft: "Microsoft",
  }[props.createType ?? props.provider.id] ?? `Custom Oauth provider: ${props.provider?.id}`;

  return (
    <AccordionWrapper
      title={title}
    >
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua.
    </AccordionWrapper>
  );
}

function ProviderForm(props: Props) {
  const [hasChanges, setHasChanges] = useState(false);

  const niceOptionProps = {
    shared: {
      title: "Shared keys (development)",
      description: "Use keys created by the Stack team for development. It helps you get started, but will show a Stack logo and name on the OAuth screen. This should never be enabled in production.",
    },
    own: {
      title: "Own keys (development & production)",
      description: "Use your own keys. Requires you to register with the provider, but lets you customize the OAuth screen.",
    },
  };

  return (
    <form>
      <Stack spacing={2} marginY={2}>
        <FormControl required>
          <FormLabel>
            Key sharing mode
          </FormLabel>
          <Select<keyof typeof niceOptionProps>
            onChange={() => setHasChanges(true)}
            name="keySharingMode"
            defaultValue="shared"
            renderValue={(option) => {
              if (!option) return null;
              return (
                <NiceOptionContent
                  {...niceOptionProps[option.value]}
                  paddingY={1}
                />
              );
            }}
            slotProps={{
              listbox: {
                sx: { minWidth: 160 },
              },
            }}
          >
            {Object.entries(niceOptionProps).map(([value, props]) => (
              <Option key={value} value={value}>
                <NiceOptionContent {...props} />
              </Option>
            ))}
          </Select>
        </FormControl>

        <FormControl required>
          <FormLabel>
            Client ID
          </FormLabel>
          <Input
            name="clientId"
            onChange={() => setHasChanges(true)}
            // @ts-expect-error
            defaultValue={props.provider?.clientId ?? ""}
          />
        </FormControl>

        <FormControl required>
          <FormLabel>
            Client secret
          </FormLabel>
          <Input
            name="clientSecret"
            onChange={() => setHasChanges(true)}
            // @ts-expect-error
            defaultValue={props.provider?.clientSecret ?? ""}
          />
        </FormControl>

        <Stack direction="row" spacing={2}>
          {!!props.provider && (
            <AsyncButton
              type="button"
              variant="plain"
              color="danger"
              onClick={async () => {
                alert("Not implemented yet");
              }}
            >
              Delete
            </AsyncButton>
          )}
          <Box flexGrow={1} />
          {!!props.provider && hasChanges && (
            <AsyncButton
              type="reset"
              variant="plain"
              color="neutral"
              disabled={!hasChanges}
              onClick={async () => {
                alert("Not implemented yet");
              }}
            >
              Undo changes
            </AsyncButton>
          )}
          <AsyncButton
            type="submit"
            color="primary"
            disabled={!!props.provider && !hasChanges}
            onClick={async () => {
              alert("Not implemented yet");
            }}
          >
            {props.provider ? "Save" : "Create"}
          </AsyncButton>
        </Stack>
      </Stack>
    </form>
  );
}


function AccordionWrapper(props: { title: string, children: React.ReactNode }) {
  return (
    <Accordion>
      <AccordionSummary>
        {props.title}
      </AccordionSummary>
      <AccordionDetails>
        {props.children}
      </AccordionDetails>
    </Accordion>
  );
}

function NiceOptionContent({ title, description, ...boxProps }: { title: string, description: string } & BoxProps) {
  return (
    <Box
      sx={{
        textAlign: "initial",
        whiteSpace: "normal",
      }}
      {...boxProps}
    >
      <Paragraph body sx={{ m: 0 }}>
        {title}
      </Paragraph>
      <Paragraph sidenote sx={{ m: 0 }}>
        {description}
      </Paragraph>
    </Box>
  );
}
