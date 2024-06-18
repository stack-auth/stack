import dotenv from "dotenv";

export default function globalSetup() {
  dotenv.config({
    path: [
      ".env.development.local",
      ".env.local",
      ".env.development",
      ".env",
    ],
  });
  
  return () => {};
}
