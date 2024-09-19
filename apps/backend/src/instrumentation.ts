import { PrismaInstrumentation } from "@prisma/instrumentation";
import "./polyfills";

import { registerOTel } from '@vercel/otel';

export function register() {
  registerOTel({
    serviceName: 'stack-backend',
    instrumentations: [new PrismaInstrumentation()],
  });
}
