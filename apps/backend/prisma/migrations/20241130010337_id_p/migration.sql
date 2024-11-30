-- CreateTable
CREATE TABLE "IdPAdapterData" (
    "model" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdPAdapterData_pkey" PRIMARY KEY ("model","id")
);

-- CreateIndex
CREATE INDEX "IdPAdapterData_payload_idx" ON "IdPAdapterData" USING GIN ("payload" jsonb_path_ops);

-- CreateIndex
CREATE INDEX "IdPAdapterData_expiresAt_idx" ON "IdPAdapterData"("expiresAt");
