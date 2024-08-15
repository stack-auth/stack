export const standardProviders = ["google", "github", "facebook", "microsoft", "spotify", "discord"] as const;
export const sharedProviders = ["google", "github", "facebook", "microsoft", "spotify", "discord"] as const;
export const allProviders = ["google", "github", "facebook", "microsoft", "spotify", "discord"] as const;

export type ProviderType = typeof allProviders[number];
export type StandardProviderType = typeof standardProviders[number];
export type SharedProviderType = typeof sharedProviders[number];
