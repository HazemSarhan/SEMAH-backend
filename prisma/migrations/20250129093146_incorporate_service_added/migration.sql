-- CreateEnum
CREATE TYPE "IncorporationLocations" AS ENUM ('EGYPT', 'OMAN', 'UAE');

-- CreateEnum
CREATE TYPE "ActivityTypes" AS ENUM ('SERVICE_ACTIVITY', 'INDUSTRIAL_ACTIVITY', 'BUSINESS_ACTIVITY', 'AGRICULTURAL_ACTIVITY', 'PROFESSIONAL_ACTIVITY');

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "incorporationServiceId" INTEGER;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "incorporationServiceId" INTEGER;

-- CreateTable
CREATE TABLE "IncorporationServices" (
    "id" SERIAL NOT NULL,
    "activityType" "ActivityTypes" NOT NULL,
    "outsideKSA" BOOLEAN NOT NULL,
    "anotherLocation" "IncorporationLocations",
    "price" DOUBLE PRECISION NOT NULL,
    "contract" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncorporationServices_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_incorporationServiceId_fkey" FOREIGN KEY ("incorporationServiceId") REFERENCES "IncorporationServices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_incorporationServiceId_fkey" FOREIGN KEY ("incorporationServiceId") REFERENCES "IncorporationServices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
