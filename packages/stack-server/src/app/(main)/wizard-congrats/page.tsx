import { Button, Card, Stack } from "@mui/joy";
import { Header } from '@/components/header';
import { Paragraph } from "@/components/paragraph";
import { InlineCode } from "@/components/ui/inline-code";
import { Confetti } from "@/components/confetti";
import { SmartLink } from "@/components/smart-link";

export const metadata = {
  title: "Projects",
};

export default function WizardCongratsPage() {
  return (
    <>
      <Confetti />
      <style>
        {`
          body {
            background-image: linear-gradient(45deg, #ff4444, #dd00dd, #dddd00, #ff4444, #dd00dd, #dddd00);
            background-size: 400% 400%;
            background-repeat: no-repeat;
            animation: celebrate-gradient 60s linear infinite;
          }
          @keyframes celebrate-gradient {
            0% { background-position: 0% 100%; }
            100% { background-position: 100% 0%; }
          }
        `}
      </style>
      <Stack alignItems="center" justifyContent="center" minHeight="100vh">
        <Card>
          <Stack alignItems="center" justifyContent="center">
            <Paragraph h1>
              Congrats! 🎉
            </Paragraph>
            <Paragraph body maxWidth="600px" textAlign="center">
              You successfully installed Stack in your project! 🚀
            </Paragraph>
            <Paragraph body maxWidth="600px" textAlign="center">
              Next, please sign up on our dashboard to create a new API key, and paste it into your <InlineCode>.env.local</InlineCode> file.
            </Paragraph>
            <Paragraph body alignSelf="end">
              <Stack direction="row" gap={2}>
                <Button component={SmartLink} variant="plain" href="https://docs.stack-auth.com" target="_blank">
                  Visit docs
                </Button>
                <Button component={SmartLink} href="/projects">
                  Continue
                </Button>
              </Stack>
            </Paragraph>
          </Stack>
        </Card>
      </Stack>
    </>
  );
}
