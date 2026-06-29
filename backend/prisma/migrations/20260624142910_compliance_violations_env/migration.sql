-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "complianceDueAt" TIMESTAMP(3),
ADD COLUMN     "complianceLastCheck" TIMESTAMP(3),
ADD COLUMN     "complianceReminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "envRecommendations" TEXT,
ADD COLUMN     "envSafe" BOOLEAN;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isDisabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "violationCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Violation" (
    "id" TEXT NOT NULL,
    "cookId" TEXT NOT NULL,
    "orderId" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Violation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_cookId_fkey" FOREIGN KEY ("cookId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
