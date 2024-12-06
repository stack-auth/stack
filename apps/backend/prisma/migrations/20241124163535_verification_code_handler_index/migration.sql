-- CreateIndex
CREATE INDEX "VerificationCode_data_idx" ON "VerificationCode" USING GIN ("data" jsonb_path_ops);
