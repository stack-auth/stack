-- Update existing records with new random UUIDs as strings
UPDATE "OAuthProviderConfig" SET "id" = gen_random_uuid()::text;