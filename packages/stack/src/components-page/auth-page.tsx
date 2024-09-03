"use client";

import { useEffect } from "react";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { StyledLink, Tabs, TabsContent, TabsList, TabsTrigger, Typography } from "@stackframe/stack-ui";
import { useStackApp, useUser } from "..";
import { CredentialSignIn } from "../components/credential-sign-in";
import { CredentialSignUp } from "../components/credential-sign-up";
import { MaybeFullPage } from "../components/elements/maybe-full-page";
import { SeparatorWithText } from "../components/elements/separator-with-text";
import { MagicLinkSignIn } from "../components/magic-link-sign-in";
import { PredefinedMessageCard } from "../components/message-cards/predefined-message-card";
import { OAuthButtonGroup } from "../components/oauth-button-group";

export function AuthPage({
  fullPage = false,
  type,
  automaticRedirect,
  mockProject,
}: {
  fullPage?: boolean;
  type: "sign-in" | "sign-up";
  automaticRedirect?: boolean;
  mockProject?: {
    config: {
      signUpEnabled: boolean;
      credentialEnabled: boolean;
      magicLinkEnabled: boolean;
      oauthProviders: {
        id: string;
      }[];
    };
  };
}) {
  const stackApp = useStackApp();
  const user = useUser();
  const projectFromHook = stackApp.useProject();
  const project = mockProject || projectFromHook;

  useEffect(() => {
    if (automaticRedirect) {
      if (user && !mockProject) {
        runAsynchronously(type === "sign-in" ? stackApp.redirectToAfterSignIn() : stackApp.redirectToAfterSignUp());
      }
    }
  }, [user, mockProject, stackApp, automaticRedirect]);

  if (user && !mockProject) {
    return <PredefinedMessageCard type="signedIn" fullPage={fullPage} />;
  }

  if (type === "sign-up" && !project.config.signUpEnabled) {
    return <PredefinedMessageCard type="signUpDisabled" fullPage={fullPage} />;
  }

  const enableSeparator = (project.config.credentialEnabled || project.config.magicLinkEnabled) && project.config.oauthProviders.length > 0;

  return (
    <MaybeFullPage fullPage={fullPage}>
      <div className="stack-scope flex flex-col items-stretch" style={{ width: "380px", padding: fullPage ? "1rem" : 0 }}>
        <div className="mb-6 text-center">
          <Typography type="h2">{type === "sign-in" ? "Sign in to your account" : "Create a new account"}</Typography>
          {type === "sign-in" ? (
            project.config.signUpEnabled && (
              <Typography>
                {"Don't have an account? "}
                <StyledLink
                  href={stackApp.urls.signUp}
                  onClick={(e) => {
                    runAsynchronously(stackApp.redirectToSignUp());
                    e.preventDefault();
                  }}
                >
                  Sign up
                </StyledLink>
              </Typography>
            )
          ) : (
            <Typography>
              {"Already have an account? "}
              <StyledLink
                href={stackApp.urls.signIn}
                onClick={(e) => {
                  runAsynchronously(stackApp.redirectToSignIn());
                  e.preventDefault();
                }}
              >
                Sign in
              </StyledLink>
            </Typography>
          )}
        </div>
        <OAuthButtonGroup type={type} mockProject={mockProject} />
        {enableSeparator && <SeparatorWithText text={"Or continue with"} />}
        {project.config.credentialEnabled && project.config.magicLinkEnabled ? (
          <Tabs defaultValue="magic-link">
            <TabsList className="mb-2 w-full">
              <TabsTrigger value="magic-link" className="flex-1">
                Magic Link
              </TabsTrigger>
              <TabsTrigger value="password" className="flex-1">
                Password
              </TabsTrigger>
            </TabsList>
            <TabsContent value="magic-link">
              <MagicLinkSignIn />
            </TabsContent>
            <TabsContent value="password">{type === "sign-up" ? <CredentialSignUp /> : <CredentialSignIn />}</TabsContent>
          </Tabs>
        ) : project.config.credentialEnabled ? (
          type === "sign-up" ? (
            <CredentialSignUp />
          ) : (
            <CredentialSignIn />
          )
        ) : project.config.magicLinkEnabled ? (
          <MagicLinkSignIn />
        ) : null}
      </div>
    </MaybeFullPage>
  );
}
