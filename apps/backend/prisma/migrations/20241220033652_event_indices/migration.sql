CREATE INDEX idx_event_userid ON "Event" ((data->>'userId'));
CREATE INDEX idx_event_projectid ON "Event" ((data->>'projectId'));