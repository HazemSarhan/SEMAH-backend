-- AlterTable
ALTER TABLE "Commissioner" ADD COLUMN     "canAccessMessages" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canPurchaseServices" BOOLEAN NOT NULL DEFAULT false;
