-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('AVAILABLE', 'ON_TRIP', 'OFFLINE', 'ON_BREAK');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "driverStatus" "DriverStatus" DEFAULT 'OFFLINE';
