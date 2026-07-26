-- AlterEnum
-- Se añade el valor PENDING al enum de estado de reserva (solicitudes por confirmar).
ALTER TYPE "ReservationStatus" ADD VALUE 'PENDING' BEFORE 'CONFIRMED';
