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

interface BaseEmailProps {
  projectName: string,
  previewText: string,
  logoUrl?: string,
  heading: React.ReactNode,
  textTop: string,
  buttonText: string,
  buttonLink: string,
  sharedEmail: boolean,
}

export default function BaseEmail(props: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{props.previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              {props.logoUrl && <Img
                src={props.logoUrl}
                width="200"
                height="50"
                className="my-0 mx-auto"
              />}
            </Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              {props.heading}
            </Heading>
            {props.textTop.split("\n").map((text, index) => (
              <Text key={index} className="text-black text-[14px] leading-[24px]">
                {text}
              </Text>
            ))}
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={props.buttonLink}
              >
                {props.buttonText}
              </Button>
            </Section>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-black text-[14px] leading-[24px]">
              {(props.sharedEmail ? `This email is sent from Stack on behalf of ${props.projectName}. `  : '') + `If you were not expecting this email, you can ignore it.`}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};