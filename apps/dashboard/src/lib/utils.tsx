import { clsx, type ClassValue } from "clsx";
import { redirect } from "next/navigation";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function redirectToProjectIfEmulator() {
  const isEmulator = process.env.NEXT_PUBLIC_STACK_EMULATOR_ENABLED === 'true';
  const projectId = process.env.NEXT_PUBLIC_STACK_EMULATOR_PROJECT_ID;

  if (isEmulator && projectId) {
    redirect(`/projects/${projectId}`);
  }
}
