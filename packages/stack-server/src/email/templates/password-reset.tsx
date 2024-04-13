import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

interface PasswordResetEmailProps {
  username?: string,
  projectName: string,
  passwordResetUrl: string,
  fromStack?: boolean,
  logoUrl?: string,
}

export default function PasswordResetEmail({
  username,
  projectName,
  logoUrl,
  passwordResetUrl,
  fromStack,
}: PasswordResetEmailProps) {
  const previewText = `Verify your email at ${projectName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              {logoUrl && <Img
                src={logoUrl}
                width="200"
                height="50"
                alt="Vercel"
                className="my-0 mx-auto"
              />}
            </Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Reset your <span className="font-bold">{projectName}</span> password
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello{username ? " " + username : ""},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              {`You have requested to reset the password of your account at ${projectName}. Please click on the following button to continue.`}
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={passwordResetUrl}
              >
                Reset Password
              </Button>
            </Section>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              {fromStack ? "This email is sent from Stack on behalf of " + projectName + ". " : null}
              {"If you were not expecting this invitation, you can ignore this email."}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

PasswordResetEmail.PreviewProps = {
  projectName: "MyMusic",
  passwordResetUrl: "https://example.com/verify-email",
  username: "John Doe",
  fromStack: true,
  logoUrl: "https://placehold.co/100x100",
} as PasswordResetEmailProps;
