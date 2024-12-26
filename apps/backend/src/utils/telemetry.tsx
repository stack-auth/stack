import { AttributeValue, Span, trace } from "@opentelemetry/api";

const tracer = trace.getTracer('stack-backend');

export function withTraceSpan<P extends any[], T>(optionsOrDescription: string | { description: string, attributes?: Record<string, AttributeValue> }, fn: (...args: readonly [...P, Span]) => Promise<T>): (...args: P) => Promise<T> {
  return async (...args: P) => {
    return await traceSpan(optionsOrDescription, (span) => fn(...args, span));
  };
}

export async function traceSpan<T>(optionsOrDescription: string | { description: string, attributes?: Record<string, AttributeValue> }, fn: (span: Span) => Promise<T>): Promise<T> {
  let options = typeof optionsOrDescription === 'string' ? { description: optionsOrDescription } : optionsOrDescription;
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
