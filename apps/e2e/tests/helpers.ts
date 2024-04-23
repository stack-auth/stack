function getEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export const BASE_URL = getEnvVar("SERVER_BASE_URL")
export const PROJECT_ID = getEnvVar("PROJECT_CLIENT_ID")
export const PROJECT_CLIENT_KEY = getEnvVar("PROJECT_CLIENT_KEY")