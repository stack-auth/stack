-- Some older versions allowed the empty string for OAuth provider clientId and clientSecret values.
-- We fix that.

UPDATE "StandardOAuthProviderConfig" SET "clientId" = 'invalid' WHERE "clientId" = '';
UPDATE "StandardOAuthProviderConfig" SET "clientSecret" = 'invalid' WHERE "clientSecret" = '';
