import { StackClientApp } from "@stackframe/js";

const stackClientApp = new StackClientApp({
  baseUrl: import.meta.env.VITE_STACK_API_URL,
  projectId: import.meta.env.VITE_STACK_PROJECT_ID,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
  tokenStore: "cookie",
});

const updateUIState = (user: any | null) => {
  const loginForm = document.getElementById("loginForm");
  const signUpForm = document.getElementById("signUpForm");
  const userInfo = document.getElementById("userInfo");
  const userEmailSpan = document.getElementById("userEmail");

  if (user) {
    loginForm?.classList.add("hidden");
    signUpForm?.classList.add("hidden");
    userInfo?.classList.remove("hidden");
    if (userEmailSpan) userEmailSpan.textContent = user.primaryEmail || "";
  } else {
    loginForm?.classList.remove("hidden");
    signUpForm?.classList.add("hidden");
    userInfo?.classList.add("hidden");
  }
};

stackClientApp.getUser().then(updateUIState);

document.getElementById("showSignUp")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("loginForm")?.classList.add("hidden");
  document.getElementById("signUpForm")?.classList.remove("hidden");
});

document.getElementById("showSignIn")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("loginForm")?.classList.remove("hidden");
  document.getElementById("signUpForm")?.classList.add("hidden");
});

document.getElementById("signIn")?.addEventListener("click", async () => {
  const emailInput = document.getElementById("emailInput") as HTMLInputElement;
  const passwordInput = document.getElementById("passwordInput") as HTMLInputElement;

  const result = await stackClientApp.signInWithCredential({
    email: emailInput.value,
    password: passwordInput.value,
  });

  const user = await stackClientApp.getUser();
  updateUIState(user);
  passwordInput.value = "";

  if (result.status === "error") {
    alert("Sign in failed. Please check your email and password and try again.");
  }
});

document.getElementById("signUp")?.addEventListener("click", async () => {
  const emailInput = document.getElementById("signUpEmail") as HTMLInputElement;
  const passwordInput = document.getElementById("signUpPassword") as HTMLInputElement;

  const result = await stackClientApp.signUpWithCredential({
    email: emailInput.value,
    password: passwordInput.value,
  });

  if (result.status === "error") {
    alert("Sign up failed. Please try again.");
    return;
  }

  const signInResult = await stackClientApp.signInWithCredential({
    email: emailInput.value,
    password: passwordInput.value,
  });

  const user = await stackClientApp.getUser();
  updateUIState(user);
  passwordInput.value = "";

  if (signInResult.status === "error") {
    alert("Account created but sign in failed. Please sign in manually.");
  }
});

document.getElementById("signOut")?.addEventListener("click", async () => {
  const user = await stackClientApp.getUser();
  if (user) {
    await user.signOut();
    updateUIState(null);
  }
});
