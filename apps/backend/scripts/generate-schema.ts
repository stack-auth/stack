import { listEndpoints } from '@/lib/glob';

async function main() {
  console.log("Started docs schema generator");

  const endpoints = await listEndpoints("api/v1");

  endpoints.forEach((handlersByMethod, url) => {
    console.log(url);
    handlersByMethod.forEach((handler, method) => {
      console.log(`  ${method}`);

      if (handler.overloads.size === 1) {
        console.log('    overloads: 1');
      } else {
        console.log(`    overloads: ${handler.overloads.size}`);
      }

      for (const overload of handler.overloads.values()) {
        for (const audience of ['client', 'server', 'admin'] as const) {
          const schemaAudience = overload.request.describe().fields.auth?.fields?.type;
          if (!schemaAudience) continue;
          if ("oneOf" in schemaAudience && schemaAudience.oneOf.length > 0 && schemaAudience.oneOf.includes(audience)) {
            console.log(`    ${audience}`);
          }
        }
      }
    });
  });
}

main().catch((...args) => {
  console.error(`ERROR! Could not generate schema`, ...args);
  process.exit(1);
});
