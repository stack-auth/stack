export const standardProviders = ["google", "github", "microsoft", "spotify", "facebook", "discord", "gitlab", "bitbucket"] as const;
// No more shared providers should be added except for special cases
export const sharedProviders = ["google", "github", "microsoft", "spotify"] as const;
export const allProviders = ["google", "github", "microsoft", "spotify", "facebook", "discord", "gitlab", "bitbucket"] as const;

export type ProviderType = typeof allProviders[number];
export type StandardProviderType = typeof standardProviders[number];
export type SharedProviderType = typeof sharedProviders[number];
