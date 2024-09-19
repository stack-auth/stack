-- CreateIndex
CREATE INDEX "Event_data_idx" ON "Event" USING GIN ("data" jsonb_path_ops);
