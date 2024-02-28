"use client";

import { Box, Sheet, Stack } from "@mui/joy";
import { Logo } from "@/components/logo";
import { Paragraph } from "@/components/paragraph";
import { SmartLink } from "@/components/smart-link";
import { useIsHydrated } from "@/hooks/use-is-hydrated";

export default function NotFound() {
  const isHydrated = useIsHydrated();
  const customBasePath = process.env.__NEXT_ROUTER_BASEPATH;
  const isDevelopment = process.env.NODE_ENV === "development";
  const showBasePathDisclaimer = isDevelopment && isHydrated && customBasePath && !window.location.pathname.startsWith(customBasePath);

  return (
    <Sheet
      component={Stack}
      width="100vw"
      height="100vh"
      justifyContent="center"
      alignItems="center"
      textAlign="center"
    >
      <Box
        component="main"
        maxWidth="400px"
      >
        <Paragraph body>
          <Logo width={128} />
        </Paragraph>

        <Paragraph h1>
          Oh no! 404
        </Paragraph>

        <Paragraph body>
          Page not found.<br />
          <SmartLink href="/">Go back home</SmartLink>
        </Paragraph>

        {showBasePathDisclaimer && (
          <Paragraph body>
            [Developer hint: This is probably because the base path was set to <SmartLink href="/">{customBasePath}</SmartLink> in next.config.js, but your current path is outside of that.]<br />
          </Paragraph>
        )}
      </Box>
    </Sheet>
  );
}
