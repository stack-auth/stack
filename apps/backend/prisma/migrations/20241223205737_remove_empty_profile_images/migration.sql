-- Some older versions allowed the empty string as a profile image.
-- We fix that.

UPDATE "ProjectUser" SET "profileImageUrl" = NULL WHERE "profileImageUrl" = '';
