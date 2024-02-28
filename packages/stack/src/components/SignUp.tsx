'use client';
import NextLink from 'next/link';
import DividerWithText from '../elements/DividerWithText';
import OauthGroup from '../elements/OauthGroup';
import CardFrame from '../elements/CardFrame';
import CredentialSignUp from '../elements/CredentialSignUp';
import CardHeader from '../elements/CardHeader';
import { useUser, useStackApp } from '..';
import AlreadySignedInMessageCard from '../elements/RedirectMessageCard';
import RedirectMessageCard from '../elements/RedirectMessageCard';

export default function SignUp({ redirectUrl, fullPage=false }: { redirectUrl?: string, fullPage?: boolean }) {
  const stackApp = useStackApp();
  const user = useUser();
  
  if (user) {
    return <RedirectMessageCard type='signedIn' fullPage={fullPage} />;
  }

  return (
    <CardFrame fullPage={fullPage}>
      <CardHeader title="Create a New Account">
        <p>
          {"Already have an account? "}
          <NextLink href={stackApp.urls['signIn']} passHref className="wl_text-blue-500">
            Sign in
          </NextLink>
        </p>
      </CardHeader>
      <OauthGroup type='signup' redirectUrl={redirectUrl} />
      <DividerWithText text={'OR'} />
      <CredentialSignUp redirectUrl={redirectUrl} />
    </CardFrame>
  );
}
