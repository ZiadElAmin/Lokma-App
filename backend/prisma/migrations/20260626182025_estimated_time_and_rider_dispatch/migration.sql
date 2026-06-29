-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "estimatedTime" INTEGER;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "estimatedMinutes" INTEGER;
