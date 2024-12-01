-- CreateTable
CREATE TABLE "IdPAccountToCdfcResultMapping" (
    "idpId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "idpAccountId" UUID NOT NULL,
    "cdfcResult" JSONB NOT NULL,

    CONSTRAINT "IdPAccountToCdfcResultMapping_pkey" PRIMARY KEY ("idpId","id")
);

-- CreateTable
CREATE TABLE "ProjectWrapperCodes" (
    "idpId" TEXT NOT NULL,
    "id" UUID NOT NULL,
    "interactionUid" TEXT NOT NULL,
    "authorizationCode" TEXT NOT NULL,
    "cdfcResult" JSONB NOT NULL,

    CONSTRAINT "ProjectWrapperCodes_pkey" PRIMARY KEY ("idpId","id")
);

-- CreateTable
CREATE TABLE "IdPAdapterData" (
    "idpId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdPAdapterData_pkey" PRIMARY KEY ("idpId","model","id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdPAccountToCdfcResultMapping_idpAccountId_key" ON "IdPAccountToCdfcResultMapping"("idpAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectWrapperCodes_authorizationCode_key" ON "ProjectWrapperCodes"("authorizationCode");

-- CreateIndex
CREATE INDEX "IdPAdapterData_payload_idx" ON "IdPAdapterData" USING GIN ("payload" jsonb_path_ops);

-- CreateIndex
CREATE INDEX "IdPAdapterData_expiresAt_idx" ON "IdPAdapterData"("expiresAt");
