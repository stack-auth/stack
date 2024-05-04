function getEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export const BASE_URL = getEnvVar("SERVER_BASE_URL")
export const INTERNAL_PROJECT_ID = getEnvVar("INTERNAL_PROJECT_ID")
export const INTERNAL_PROJECT_CLIENT_KEY = getEnvVar("INTERNAL_PROJECT_CLIENT_KEY")
