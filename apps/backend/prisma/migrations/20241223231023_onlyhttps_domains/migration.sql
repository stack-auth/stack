-- Some older versions allowed http:// URLs as trusted domains, instead of just https://.
-- We fix that.

UPDATE "ProjectDomain" SET "domain" = 'https://example.com' WHERE "domain" LIKE 'http://%';
