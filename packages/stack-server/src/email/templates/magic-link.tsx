import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import BaseEmail from "../components/base";

interface VerificationEmailProps {
  username?: string,
  projectName: string,
  verificationUrl: string,
  sharedEmail: boolean,
}

export default function MagicLinkEmail({
  username,
  projectName,
  verificationUrl,
  sharedEmail,
}: VerificationEmailProps) {
  const previewText = `Sign into ${projectName}`;

  return <BaseEmail
    projectName={projectName}
    previewText={previewText}
    heading={<>Sign into <span className='font-bold'>{projectName}</span></>}
    textTop={`Hello${username ? " " + username : ""},\nWelcome to ${projectName}! Please click the following button to sign in. This link will expire in 30 minutes`}
    buttonText="Sign In"
    buttonLink={verificationUrl}
    sharedEmail={sharedEmail}
  />;
};

MagicLinkEmail.PreviewProps = {
  projectName: "MyMusic",
  verificationUrl: "https://example.com",
  username: "John Doe",
  sharedEmail: true,
} as VerificationEmailProps;
