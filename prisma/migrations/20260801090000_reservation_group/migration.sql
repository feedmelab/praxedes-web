-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "groupId" TEXT;

-- CreateIndex
CREATE INDEX "Reservation_groupId_idx" ON "Reservation"("groupId");
