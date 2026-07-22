-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReservationKind" AS ENUM ('CUSTOMER', 'BLOCK');

-- AlterTable
ALTER TABLE "RentalItem" ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "kind" "ReservationKind" NOT NULL DEFAULT 'CUSTOMER',
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reservation_itemId_startDate_endDate_idx" ON "Reservation"("itemId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "RentalItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
