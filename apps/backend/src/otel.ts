import * as api from "@opentelemetry/api";
import { AsyncHooksContextManager } from "@opentelemetry/context-async-hooks";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { Resource } from "@opentelemetry/resources";
import { BasicTracerProvider, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { PrismaInstrumentation } from "@prisma/instrumentation";

export function otelSetup() {
  // only enable otel in development mode for now
  if (getEnvVariable("NODE_ENV", "") !== "development") {
    return;
  }

  const contextManager = new AsyncHooksContextManager().enable();
  api.context.setGlobalContextManager(contextManager);

  const otlpTraceExporter = new OTLPTraceExporter();

  const provider = new BasicTracerProvider({
    // Enable sampling in production for better performance
    // sampler: new TraceIdRatioBasedSampler(0.1),
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: "stack-auth-backend",
      [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
    }),
  });

  provider.addSpanProcessor(new SimpleSpanProcessor(otlpTraceExporter));

  provider.register();

  registerInstrumentations({
    instrumentations: [new PrismaInstrumentation()],
  });
}