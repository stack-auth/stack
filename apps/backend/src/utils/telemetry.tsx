import { AttributeValue, Span, trace } from "@opentelemetry/api";

const tracer = trace.getTracer('stack-backend');

export async function traceSpan<T>(options: { description: string, attributes?: Record<string, AttributeValue> }, fn: (span: Span) => Promise<T>): Promise<T> {
  return await tracer.startActiveSpan(`STACK: ${options.description}`, async (span) => {
    if (options.attributes) {
      for (const [key, value] of Object.entries(options.attributes)) {
        span.setAttribute(key, value);
      }
    }
    try {
      return await fn(span);
    } finally {
      span.end();
    }
  });
}
