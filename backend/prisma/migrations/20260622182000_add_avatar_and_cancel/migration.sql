-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isCancelled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT;
