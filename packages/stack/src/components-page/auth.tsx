'use client';

import { useRef, useEffect, useState } from "react";
import { useStackApp } from "..";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { MessageCard } from "../components/message-cards/message-card";
import { StyledLink } from "@stackframe/stack-ui";
import { captureError } from "@stackframe/stack-shared/dist/utils/errors";
import { useTranslation } from "../lib/translations";
import { urlSchema, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";

// Auth
export const authParamsSchema = yupObject({
  response_type: yupString().oneOf(['code']).required(),
  client_id: yupString().required(),
  redirect_uri: urlSchema.required(),
  code_challenge: yupString().required(),
  code_challenge_method: yupString().oneOf(['S256']).required(),
  scope: yupString().required()
}).required();


export function Auth(props: { fullPage?: boolean, searchParams: Record<string, string> }) {
  const { t } = useTranslation();
  const app = useStackApp();
  const called = useRef(false);
  const [error, setError] = useState<unknown>(null);
  const [showRedirectLink, setShowRedirectLink] = useState(false);

  const authParams = authParamsSchema.validateSync(props.searchParams);


  return <MessageCard title='work in progress' fullPage={props.fullPage}>
    <pre>{JSON.stringify(authParams, null, 2)}</pre>
  </MessageCard>;

  /*
  useEffect(() => runAsynchronously(async () => {
    if (called.current) return;
    called.current = true;
    let hasRedirected = false;
    try {
      hasRedirected = await app.callOAuthCallback();
    } catch (e: any) {
      captureError("<OAuthCallback />", e);
      setError(e);
    }
    if (!hasRedirected && (!error || process.env.NODE_ENV === 'production')) {
      await app.redirectToSignIn({ noRedirectBack: true });
    }
  }), []);

  useEffect(() => {
    setTimeout(() => setShowRedirectLink(true), 3000);
  }, []);

  return <MessageCard title='Redirecting...' fullPage={props.fullPage}>
    {showRedirectLink ? <p>{t('If you are not redirected automatically, ')}<StyledLink href={app.urls.home}>{t("click here")}</StyledLink></p> : null}
    {error ? <div>
      <p>{t("Something went wrong while processing the OAuth callback:")}</p>
      <pre>{JSON.stringify(error, null, 2)}</pre>
      <p>{t("This is most likely an error in Stack. Please report it.")}</p>
    </div> : null}
  </MessageCard>;
  */
}
