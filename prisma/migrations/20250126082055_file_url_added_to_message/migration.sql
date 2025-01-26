-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "fileUrl" TEXT,
ALTER COLUMN "content" DROP NOT NULL;
