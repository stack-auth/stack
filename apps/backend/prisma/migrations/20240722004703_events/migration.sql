-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isWide" BOOLEAN NOT NULL,
    "eventStartedAt" TIMESTAMP(3) NOT NULL,
    "eventEndedAt" TIMESTAMP(3) NOT NULL,
    "systemEventTypeIds" TEXT[],
    "data" JSONB NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);
