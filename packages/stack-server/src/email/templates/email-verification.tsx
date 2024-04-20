import BaseEmail from "../components/base";

interface VerificationEmailProps {
  username?: string,
  projectName: string,
  verificationUrl: string,
  sharedEmail: boolean,
  logoUrl?: string,
}

export default function VerificationEmail({
  username,
  projectName,
  logoUrl,
  verificationUrl,
  sharedEmail,
}: VerificationEmailProps) {
  return <BaseEmail
    projectName={projectName}
    previewText={`Verify your email at ${projectName}`}
    logoUrl={logoUrl}
    heading={<>Verify your email at <span className='font-bold'>{projectName}</span></>}
    textTop={`Hello${username ? " " + username : ""},\nWelcome to ${projectName}! Please click on the following button to verify your email. This link will expire in 3 hours`}
    buttonText="Verify Email"
    buttonLink={verificationUrl}
    sharedEmail={sharedEmail}
  />;
};

VerificationEmail.PreviewProps = {
  projectName: "MyMusic",
  verificationUrl: "https://example.com",
  username: "John Doe",
  sharedEmail: true,
} as VerificationEmailProps;
