// Ensure the following environment variable is set:
//   DURABLES_CONNECTION_STRING=memory://

import { DurableVariable } from "@stackframe/durables";

async function main() {
  const variable = new DurableVariable<string | undefined>("durables-variable-example:v1");


  // You can get or set variables
  console.log("Value:", await variable.get());  // prints undefined
  await variable.set("Hello, world!");
  console.log("Updated value:", await variable.get());  // prints "Hello, world!"
}
main().catch(console.error);


