-- Some older versions allowed the empty string as a team profile image.
-- We fix that.

UPDATE "Team" SET "profileImageUrl" = NULL WHERE "profileImageUrl" = '';
