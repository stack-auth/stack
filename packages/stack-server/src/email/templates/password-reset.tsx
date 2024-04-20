import BaseEmail from "../components/base";

interface PasswordResetEmailProps {
  username?: string,
  projectName: string,
  passwordResetUrl: string,
  sharedEmail: boolean,
}

export default function PasswordResetEmail({
  username,
  projectName,
  passwordResetUrl,
  sharedEmail,
}: PasswordResetEmailProps) {
  const previewText = `Reset your password at ${projectName}`;

  return <BaseEmail
    projectName={projectName}
    previewText={previewText}
    heading={<>Reset your <span className='font-bold'>{projectName}</span> password</>}
    textTop={`Hello${username ? " " + username : ""},\nYou have requested to reset the password of your account at ${projectName}. Please click on the following button to continue. This link will expire in 3 hours`}
    buttonText="Reset Password"
    buttonLink={passwordResetUrl}
    sharedEmail={sharedEmail}
  />;
};

PasswordResetEmail.PreviewProps = {
  projectName: "MyMusic",
  passwordResetUrl: "https://example.com",
  username: "John Doe",
  sharedEmail: true,
} as PasswordResetEmailProps;
