import { StackClientApp } from "@stackframe/js";

const stackClientApp = new StackClientApp({
  projectId: "your-project-id-from-dashboard",
  publishableClientKey: "your-publishable-client-key-from-dashboard",
  tokenStore: "cookie",
});

document.getElementById("signIn")?.addEventListener("click", async () => {
  await stackClientApp.signInWithCredential({
    email: "test@example.com",
    password: "password123",
  });

  const user = await stackClientApp.getUser();
  console.log("Signed in user:", user);
});

document.getElementById("signOut")?.addEventListener("click", async () => {
  const user = await stackClientApp.getUser();

  if (user) {
    await user.signOut();
    console.log("Signed out.");
  } else {
    console.log("Not signed in.");
  }
});
