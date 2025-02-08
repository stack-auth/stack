import { StackServerApp } from "@stackframe/js";

const stackServerApp = new StackServerApp({
  tokenStore: 'memory',
});

stackServerApp.listUsers().then((users) => {
  console.log(users);
});

stackServerApp.getUser().then((user) => {
  console.log(user);
});
