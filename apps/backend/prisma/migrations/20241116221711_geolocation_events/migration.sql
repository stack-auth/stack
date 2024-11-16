-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "endUserIpInfoGuessId" UUID,
ADD COLUMN     "isEndUserIpInfoGuessTrusted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "EventIpInfo" (
    "id" UUID NOT NULL,
    "ip" TEXT NOT NULL,
    "countryCode" TEXT,
    "regionCode" TEXT,
    "cityName" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "tzIdentifier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventIpInfo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_endUserIpInfoGuessId_fkey" FOREIGN KEY ("endUserIpInfoGuessId") REFERENCES "EventIpInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
