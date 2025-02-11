-- It's very common to query by userId, projectId, branchId, and eventStartedAt at the same time.
-- We can use a composite index to speed up the query.
-- Sadly we can't add this to the Prisma schema itself because Prisma does not understand composite indexes of JSONB fields.
-- So we have to add it manually.
CREATE INDEX idx_event_userid_projectid_branchid_eventstartedat ON "Event" ((data->>'projectId'), (data->>'branchId'), (data->>'userId'), "eventStartedAt");
