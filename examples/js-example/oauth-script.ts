import { StackClientApp } from "@stackframe/js";

// Add type declaration for Vite's import.meta.env
declare global {
  interface ImportMeta {
    env: {
      VITE_STACK_API_URL: string;
      VITE_STACK_PROJECT_ID: string;
      VITE_STACK_PUBLISHABLE_CLIENT_KEY: string;
    };
  }
}

const stackClientApp = new StackClientApp({
  baseUrl: import.meta.env.VITE_STACK_API_URL,
  projectId: import.meta.env.VITE_STACK_PROJECT_ID,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
  tokenStore: "cookie",
  urls: {
    oauthCallback: window.location.origin + "/oauth",
  },
});

const updateUIState = (user: any | null) => {
  const loginButtons = document.getElementById("loginButtons");
  const userInfo = document.getElementById("userInfo");
  const userEmailSpan = document.getElementById("userEmail");

  if (user) {
    loginButtons?.classList.add("hidden");
    userInfo?.classList.remove("hidden");
    if (userEmailSpan) userEmailSpan.textContent = user.primaryEmail || "";
  } else {
    loginButtons?.classList.remove("hidden");
    userInfo?.classList.add("hidden");
  }
};

// Check if user is already signed in
stackClientApp.getUser().then(updateUIState);

// Handle Google Sign In
document.getElementById("googleSignIn")?.addEventListener("click", async () => {
  try {
    await stackClientApp.signInWithOAuth('google');
  } catch (error) {
    console.error("Google sign in failed:", error);
    alert("Failed to initialize Google sign in");
  }
});

// Handle OAuth redirect
window.addEventListener("load", async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    
    if (code && state) {
      const user = await stackClientApp.callOAuthCallback();
      updateUIState(user);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch (error) {
    console.error("Failed to handle OAuth redirect:", error);
    alert("Authentication failed. Please try again.");
  }
}); 
