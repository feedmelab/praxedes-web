-- CreateEnum
CREATE TYPE "ImageFocal" AS ENUM ('TOP', 'CENTER', 'BOTTOM');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "coverFocal" "ImageFocal" NOT NULL DEFAULT 'TOP';

-- AlterTable
ALTER TABLE "ProjectImage" ADD COLUMN     "focal" "ImageFocal" NOT NULL DEFAULT 'TOP';
