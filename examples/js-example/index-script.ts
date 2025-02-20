import { stackClientApp } from "./stack";

const updateUIState = (user: any | null) => {
  const authOptions = document.getElementById("authOptions");
  const userInfo = document.getElementById("userInfo");
  const userEmailSpan = document.getElementById("userEmail");

  if (user) {
    authOptions?.classList.add("hidden");
    userInfo?.classList.remove("hidden");
    if (userEmailSpan) userEmailSpan.textContent = user.primaryEmail || "";
  } else {
    authOptions?.classList.remove("hidden");
    userInfo?.classList.add("hidden");
  }
};

// Check if user is already signed in
stackClientApp.getUser().then(updateUIState);

// Handle Sign Out
document.getElementById("signOut")?.addEventListener("click", async () => {
  const user = await stackClientApp.getUser();
  if (user) {
    await user.signOut();
    updateUIState(null);
  }
}); 
