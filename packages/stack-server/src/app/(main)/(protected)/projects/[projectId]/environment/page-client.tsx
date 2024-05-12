"use client";

import { Typography } from "@mui/joy";
import React, { useState } from "react";
import { InlineCode } from "@/components/inline-code";
import { Paragraph } from "@/components/paragraph";
import { IconAlert } from "@/components/icon-alert";
import { Enumeration, EnumerationItem } from "@/components/enumeration";
import { SmartLink } from "@/components/smart-link";
import { SmartSwitch } from "@/components/smart-switch";
import { SimpleCard } from "@/components/simple-card";
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";

export default function EnvironmentClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();

  const productionModeErrors = project.getProductionModeErrors();

  const [productionModeUpdateLoading, setProductionModeUpdateLoading] = useState(false);


  return (
    <PageLayout title="Environment" description="Development and production settings">
      <SimpleCard title="Production mode">
        <SmartSwitch
          checked={project.isProductionMode}
          disabled={!project.isProductionMode && productionModeErrors.length > 0}
          size="lg"
          sx={{
            visibility: productionModeUpdateLoading ? "hidden" : "visible",
          }}
          onChange={async (event) => {
            setProductionModeUpdateLoading(true);
            try {
              await project.update({
                isProductionMode: event.target.checked,
              });
            } finally {
              setProductionModeUpdateLoading(false);
            }
          }}
        >
          <Typography>
            Enable production mode
          </Typography>
        </SmartSwitch>
        
        <Paragraph sidenote>
          Production mode disallows certain configuration options that are useful for development but deemed unsafe for production usage (such as using <InlineCode>localhost</InlineCode> in authentication callback URLs). While your app will behave exactly the same in development and production modes, to prevent accidental misconfigurations it is strongly recommended to enable production mode on your production environments.
        </Paragraph>
        
        <Paragraph sidenote sx={{ mt: 0 }}>
          Before enabling production mode, you may need to first manually edit the configuration options listed below.
        </Paragraph>

        {productionModeErrors.length === 0 ? (
          <IconAlert color="success">
            Your configuration is ready for production and production mode can be enabled. Good job!
          </IconAlert>
        ) : (
          <IconAlert color="danger">
            Your configuration is not ready for production mode. Please fix the following issues:
            <Enumeration type="bulleted">
              {productionModeErrors.map((error, index) => (
                <EnumerationItem
                  key={error.errorMessage}
                >
                  {error.errorMessage} (<SmartLink href={error.fixUrlRelative} fontSize="inherit">show configuration</SmartLink>)
                </EnumerationItem>
              ))}
            </Enumeration>
          </IconAlert>
        )}
      </SimpleCard>
    </PageLayout>
  );
}
